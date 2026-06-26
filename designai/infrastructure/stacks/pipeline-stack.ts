import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { bundledPythonCode } from '../lib/python-lambda';

export interface PipelineStackProps extends cdk.StackProps {
  projectName: string;
  vpc: ec2.IVpc;
  projectsTable: dynamodb.Table;
  uploadsBucket: s3.Bucket;
  rendersBucket: s3.Bucket;
  assetsBucket: s3.Bucket;
}

export class PipelineStack extends cdk.Stack {
  public readonly designPipeline: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // Lambda execution role for pipeline stages
    const pipelineRole = new iam.Role(this, 'PipelineLambdaRole', {
      roleName: `${props.projectName}-pipeline-lambda-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    props.projectsTable.grantReadWriteData(pipelineRole);
    props.uploadsBucket.grantRead(pipelineRole);
    props.rendersBucket.grantReadWrite(pipelineRole);
    props.assetsBucket.grantReadWrite(pipelineRole);

    // AI permissions
    pipelineRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:*::foundation-model/*`,
        `arn:aws:bedrock:*:${this.account}:inference-profile/*`,
      ],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sagemaker:InvokeEndpoint'],
      resources: [
        `arn:aws:sagemaker:${this.region}:${this.account}:endpoint/${props.projectName}-controlnet-endpoint`,
        `arn:aws:sagemaker:${this.region}:${this.account}:endpoint/${props.projectName}-midas-endpoint`,
        `arn:aws:sagemaker:${this.region}:${this.account}:endpoint/${props.projectName}-triposr-endpoint`,
      ],
    }));

    pipelineRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['rekognition:DetectLabels'],
      resources: ['*'],
    }));

    // Pipeline Stage Lambdas
    const validateLambda = new lambda.Function(this, 'ValidateLambda', {
      functionName: `${props.projectName}-pipeline-validate`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'validate.handler',
      code: bundledPythonCode('../lambda/ai-analyzer'),
      role: pipelineRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        UPLOADS_BUCKET: props.uploadsBucket.bucketName,
      },
    });

    const segmentationLambda = new lambda.Function(this, 'SegmentationLambda', {
      functionName: `${props.projectName}-pipeline-segmentation`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'segmentation.handler',
      code: bundledPythonCode('../lambda/ai-analyzer'),
      role: pipelineRole,
      timeout: cdk.Duration.minutes(2),
      memorySize: 1024,
      environment: {
        UPLOADS_BUCKET: props.uploadsBucket.bucketName,
      },
    });

    const depthLambda = new lambda.Function(this, 'DepthLambda', {
      functionName: `${props.projectName}-pipeline-depth`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'depth.handler',
      code: bundledPythonCode('../lambda/ai-analyzer'),
      role: pipelineRole,
      timeout: cdk.Duration.minutes(2),
      memorySize: 1024,
      environment: {
        MIDAS_ENDPOINT: `${props.projectName}-midas-endpoint`,
        UPLOADS_BUCKET: props.uploadsBucket.bucketName,
      },
    });

    const pinterestLambda = new lambda.Function(this, 'PinterestLambda', {
      functionName: `${props.projectName}-pipeline-pinterest`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'pinterest.handler',
      code: bundledPythonCode('../lambda/ai-analyzer'),
      role: pipelineRole,
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      environment: {
        BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-6',
      },
    });

    const bedrockLambda = new lambda.Function(this, 'BedrockLambda', {
      functionName: `${props.projectName}-pipeline-bedrock`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'bedrock_reason.handler',
      code: bundledPythonCode('../lambda/ai-analyzer'),
      role: pipelineRole,
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      environment: {
        BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-6',
        PROJECTS_TABLE: props.projectsTable.tableName,
      },
    });

    const assetRetrievalLambda = new lambda.Function(this, 'AssetRetrievalLambda', {
      functionName: `${props.projectName}-pipeline-asset-retrieval`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'asset_retrieval.handler',
      code: bundledPythonCode('../lambda/ai-analyzer'),
      role: pipelineRole,
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      environment: {
        ASSETS_BUCKET: props.assetsBucket.bucketName,
      },
    });

    const sceneAssemblyLambda = new lambda.Function(this, 'SceneAssemblyLambda', {
      functionName: `${props.projectName}-pipeline-scene-assembly`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'scene_assembly.handler',
      code: bundledPythonCode('../lambda/ai-analyzer'),
      role: pipelineRole,
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
      environment: {
        PROJECTS_TABLE: props.projectsTable.tableName,
      },
    });

    const persistLambda = new lambda.Function(this, 'PersistLambda', {
      functionName: `${props.projectName}-pipeline-persist`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'persist.handler',
      code: bundledPythonCode('../lambda/ai-analyzer'),
      role: pipelineRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        PROJECTS_TABLE: props.projectsTable.tableName,
      },
    });

    const notifyLambda = new lambda.Function(this, 'NotifyLambda', {
      functionName: `${props.projectName}-pipeline-notify`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'notify.handler',
      code: bundledPythonCode('../lambda/ai-analyzer'),
      role: pipelineRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        PROJECTS_TABLE: props.projectsTable.tableName,
      },
    });

    // Step Functions State Machine
    const validateTask = new tasks.LambdaInvoke(this, 'Validate', {
      lambdaFunction: validateLambda,
      outputPath: '$.Payload',
    });

    const segmentTask = new tasks.LambdaInvoke(this, 'Segmentation', {
      lambdaFunction: segmentationLambda,
      outputPath: '$.Payload',
    });

    const depthTask = new tasks.LambdaInvoke(this, 'DepthEstimation', {
      lambdaFunction: depthLambda,
      outputPath: '$.Payload',
    });

    // Parallel: Segmentation + Depth
    const parallelVision = new sfn.Parallel(this, 'VisionParallel', {
      resultPath: '$.visionResults',
    });
    parallelVision.branch(segmentTask);
    parallelVision.branch(depthTask);

    const pinterestTask = new tasks.LambdaInvoke(this, 'PinterestAnalysis', {
      lambdaFunction: pinterestLambda,
      outputPath: '$.Payload',
    });

    const bedrockTask = new tasks.LambdaInvoke(this, 'BedrockReasoning', {
      lambdaFunction: bedrockLambda,
      outputPath: '$.Payload',
    });

    const assetRetrievalTask = new tasks.LambdaInvoke(this, 'AssetRetrieval', {
      lambdaFunction: assetRetrievalLambda,
      outputPath: '$.Payload',
    });

    // Choice: Assets found or generate?
    const assetsFound = new sfn.Choice(this, 'AssetsFound?');
    const generateAssets = new sfn.Pass(this, 'GeneratePlaceholders', {
      comment: 'Load placeholder meshes; async generation via WebSocket swap',
    });
    const loadAssets = new sfn.Pass(this, 'LoadCatalogAssets');

    const sceneAssemblyTask = new tasks.LambdaInvoke(this, 'SceneAssembly', {
      lambdaFunction: sceneAssemblyLambda,
      outputPath: '$.Payload',
    });

    const persistTask = new tasks.LambdaInvoke(this, 'Persist', {
      lambdaFunction: persistLambda,
      outputPath: '$.Payload',
    });

    const notifyTask = new tasks.LambdaInvoke(this, 'Notify', {
      lambdaFunction: notifyLambda,
      outputPath: '$.Payload',
    });

    // Pre-wire the tail: SceneAssembly -> Persist -> Notify
    sceneAssemblyTask.next(persistTask).next(notifyTask);

    // Both Choice branches converge on SceneAssembly
    loadAssets.next(sceneAssemblyTask);
    generateAssets.next(sceneAssemblyTask);

    // Chain ends at the Choice (you cannot .next() after a Choice state)
    const definition = validateTask
      .next(parallelVision)
      .next(pinterestTask)
      .next(bedrockTask)
      .next(assetRetrievalTask)
      .next(
        assetsFound
          .when(sfn.Condition.booleanEquals('$.allAssetsFound', true), loadAssets)
          .otherwise(generateAssets)
      );

    this.designPipeline = new sfn.StateMachine(this, 'DesignPipeline', {
      stateMachineName: `${props.projectName}-design-pipeline`,
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.minutes(10),
      tracingEnabled: true,
    });

    // EventBridge Rule: Trigger pipeline on S3 upload
    const uploadRule = new events.Rule(this, 'UploadRule', {
      ruleName: `${props.projectName}-upload-trigger`,
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: { name: [props.uploadsBucket.bucketName] },
        },
      },
    });

    uploadRule.addTarget(new targets.SfnStateMachine(this.designPipeline));

    // Outputs
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.designPipeline.stateMachineArn,
      exportName: `${props.projectName}-pipeline-arn`,
    });
  }
}

