import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { bundledPythonCode } from '../lib/python-lambda';

export interface ApiStackProps extends cdk.StackProps {
  projectName: string;
  vpc: ec2.IVpc;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  projectsTable: dynamodb.Table;
  uploadsBucket: s3.Bucket;
  rendersBucket: s3.Bucket;
  assetsBucket: s3.Bucket;
}

export class ApiStack extends cdk.Stack {
  public readonly restApi: apigateway.RestApi;
  public readonly webSocketApi: apigatewayv2.WebSocketApi;
  public readonly analysisQueue: sqs.Queue;
  public readonly renderQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // SQS Queues
    const analysisDlq = new sqs.Queue(this, 'AnalysisDLQ', {
      queueName: `${props.projectName}-analysis-dlq`,
      retentionPeriod: cdk.Duration.days(14),
    });

    this.analysisQueue = new sqs.Queue(this, 'AnalysisQueue', {
      queueName: `${props.projectName}-analysis-jobs`,
      visibilityTimeout: cdk.Duration.minutes(5),
      deadLetterQueue: {
        queue: analysisDlq,
        maxReceiveCount: 3,
      },
    });

    const renderDlq = new sqs.Queue(this, 'RenderDLQ', {
      queueName: `${props.projectName}-render-dlq`,
      retentionPeriod: cdk.Duration.days(14),
    });

    this.renderQueue = new sqs.Queue(this, 'RenderQueue', {
      queueName: `${props.projectName}-render-jobs`,
      visibilityTimeout: cdk.Duration.minutes(15),
      deadLetterQueue: {
        queue: renderDlq,
        maxReceiveCount: 3,
      },
    });

    // Lambda Execution Role (shared for API lambdas)
    const apiLambdaRole = new iam.Role(this, 'ApiLambdaRole', {
      roleName: `${props.projectName}-api-lambda-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Grant permissions
    props.projectsTable.grantReadWriteData(apiLambdaRole);
    props.uploadsBucket.grantReadWrite(apiLambdaRole);
    props.rendersBucket.grantReadWrite(apiLambdaRole);
    props.assetsBucket.grantRead(apiLambdaRole);
    this.analysisQueue.grantSendMessages(apiLambdaRole);
    this.renderQueue.grantSendMessages(apiLambdaRole);

    // Bedrock permission
    apiLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:*::foundation-model/*`,
        `arn:aws:bedrock:*:${this.account}:inference-profile/*`,
      ],
    }));

    // Rekognition permission
    apiLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['rekognition:DetectLabels', 'rekognition:DetectModerationLabels'],
      resources: ['*'],
    }));

    // SageMaker invoke permission (render worker: ControlNet, MiDaS, SDXL)
    apiLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sagemaker:InvokeEndpoint'],
      resources: [
        `arn:aws:sagemaker:${this.region}:${this.account}:endpoint/${props.projectName}-controlnet-endpoint`,
        `arn:aws:sagemaker:${this.region}:${this.account}:endpoint/${props.projectName}-midas-endpoint`,
        `arn:aws:sagemaker:${this.region}:${this.account}:endpoint/${props.projectName}-sdxl-endpoint`,
      ],
    }));

    // WebSocket management permission (render worker pushes render_complete / render_timeout)
    apiLambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['execute-api:ManageConnections'],
      resources: [`arn:aws:execute-api:${this.region}:${this.account}:*`],
    }));

    // Main API Lambda (coarse-grained REST router)
    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      functionName: `${props.projectName}-api-handler`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'main.handler',
      code: bundledPythonCode('../backend', 'requirements-lambda.txt'),
      role: apiLambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        PROJECTS_TABLE: props.projectsTable.tableName,
        UPLOADS_BUCKET: props.uploadsBucket.bucketName,
        RENDERS_BUCKET: props.rendersBucket.bucketName,
        ASSETS_BUCKET: props.assetsBucket.bucketName,
        ANALYSIS_QUEUE_URL: this.analysisQueue.queueUrl,
        RENDER_QUEUE_URL: this.renderQueue.queueUrl,
        BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-6',
        AWS_REGION_NAME: this.region,
      },
    });

    // REST API with Cognito Authorizer
    this.restApi = new apigateway.RestApi(this, 'RestApi', {
      restApiName: `${props.projectName}-api`,
      description: 'Seeley REST API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
      },
      deployOptions: {
        stageName: 'v1',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
      authorizerName: `${props.projectName}-authorizer`,
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(apiHandler);

    // API Resources
    const apiResource = this.restApi.root;
    const projectResource = apiResource.addResource('project');
    const uploadResource = apiResource.addResource('upload');
    const renderResource = apiResource.addResource('render');
    const recommendResource = apiResource.addResource('recommend');
    const assetsResource = apiResource.addResource('assets');
    const sceneResource = apiResource.addResource('scene');

    const authOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // project endpoints
    projectResource.addMethod('POST', lambdaIntegration, authOptions);
    projectResource.addMethod('GET', lambdaIntegration, authOptions);
    const projectIdResource = projectResource.addResource('{projectId}');
    projectIdResource.addMethod('GET', lambdaIntegration, authOptions);
    projectIdResource.addMethod('DELETE', lambdaIntegration, authOptions);

    // upload endpoints
    uploadResource.addMethod('POST', lambdaIntegration, authOptions);

    // render endpoints
    renderResource.addMethod('POST', lambdaIntegration, authOptions);
    const renderStatusResource = renderResource.addResource('{jobId}');
    renderStatusResource.addMethod('GET', lambdaIntegration, authOptions);

    // recommend endpoints
    recommendResource.addMethod('GET', lambdaIntegration, authOptions);

    // assets endpoints
    assetsResource.addMethod('GET', lambdaIntegration, authOptions);

    // scene endpoints
    sceneResource.addMethod('POST', lambdaIntegration, authOptions);
    sceneResource.addMethod('GET', lambdaIntegration, authOptions);

    // WebSocket API for real-time updates
    const wsConnectHandler = new lambda.Function(this, 'WsConnectHandler', {
      functionName: `${props.projectName}-ws-connect`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'ws_handler.connect',
      code: bundledPythonCode('../lambda/upload-processor'),
      role: apiLambdaRole,
      timeout: cdk.Duration.seconds(10),
      environment: {
        PROJECTS_TABLE: props.projectsTable.tableName,
      },
    });

    const wsDisconnectHandler = new lambda.Function(this, 'WsDisconnectHandler', {
      functionName: `${props.projectName}-ws-disconnect`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'ws_handler.disconnect',
      code: bundledPythonCode('../lambda/upload-processor'),
      role: apiLambdaRole,
      timeout: cdk.Duration.seconds(10),
      environment: {
        PROJECTS_TABLE: props.projectsTable.tableName,
      },
    });

    this.webSocketApi = new apigatewayv2.WebSocketApi(this, 'WebSocketApi', {
      apiName: `${props.projectName}-websocket`,
      connectRouteOptions: {
        integration: new apigatewayv2integrations.WebSocketLambdaIntegration('ConnectIntegration', wsConnectHandler),
      },
      disconnectRouteOptions: {
        integration: new apigatewayv2integrations.WebSocketLambdaIntegration('DisconnectIntegration', wsDisconnectHandler),
      },
    });

    const wsStage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi: this.webSocketApi,
      stageName: 'v1',
      autoDeploy: true,
    });

    // Render Worker Lambda — SQS-triggered, two output branches (ControlNet + SDXL/FLUX)
    const renderWorker = new lambda.Function(this, 'RenderWorker', {
      functionName: `${props.projectName}-render-worker`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'handler.handler',
      code: bundledPythonCode('../lambda/render-worker'),
      role: apiLambdaRole,
      timeout: cdk.Duration.seconds(90),
      memorySize: 1024,
      reservedConcurrentExecutions: 10,
      environment: {
        UPLOADS_BUCKET: props.uploadsBucket.bucketName,
        RENDERS_BUCKET: props.rendersBucket.bucketName,
        PROJECTS_TABLE: props.projectsTable.tableName,
        SAGEMAKER_CONTROLNET_ENDPOINT: `${props.projectName}-controlnet-endpoint`,
        SAGEMAKER_MIDAS_ENDPOINT: `${props.projectName}-midas-endpoint`,
        SAGEMAKER_SDXL_ENDPOINT: `${props.projectName}-sdxl-endpoint`,
        WEBSOCKET_ENDPOINT: wsStage.url.replace('wss://', 'https://'),
        RENDER_TIMEOUT_SECONDS: '120',
        AWS_REGION_NAME: this.region,
      },
    });
    renderWorker.addEventSource(new lambdaEventSources.SqsEventSource(this.renderQueue, {
      batchSize: 1,
    }));

    // Outputs
    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: this.restApi.url,
      exportName: `${props.projectName}-api-url`,
    });

    new cdk.CfnOutput(this, 'WebSocketUrl', {
      value: wsStage.url,
      exportName: `${props.projectName}-ws-url`,
    });

    new cdk.CfnOutput(this, 'AnalysisQueueUrl', {
      value: this.analysisQueue.queueUrl,
      exportName: `${props.projectName}-analysis-queue-url`,
    });

    new cdk.CfnOutput(this, 'RenderQueueUrl', {
      value: this.renderQueue.queueUrl,
      exportName: `${props.projectName}-render-queue-url`,
    });
  }
}

