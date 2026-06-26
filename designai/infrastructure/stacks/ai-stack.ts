import * as cdk from 'aws-cdk-lib';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import { Construct } from 'constructs';

export interface AiStackProps extends cdk.StackProps {
  projectName: string;
  vpc: ec2.IVpc;
}

export class AiStack extends cdk.Stack {
  public readonly controlNetEndpoint: sagemaker.CfnEndpoint;
  public readonly midasEndpoint: sagemaker.CfnEndpoint;
  public readonly tripoSrEndpoint: sagemaker.CfnEndpoint;
  public readonly sdxlEndpoint: sagemaker.CfnEndpoint;

  constructor(scope: Construct, id: string, props: AiStackProps) {
    super(scope, id, props);

    const pytorchGpuImage = `763104351884.dkr.ecr.${this.region}.amazonaws.com/pytorch-inference:2.0.1-gpu-py310-cu118-ubuntu20.04-sagemaker`;
    const pytorchCpuImage = `763104351884.dkr.ecr.${this.region}.amazonaws.com/pytorch-inference:2.0.1-cpu-py310-ubuntu20.04-sagemaker`;

    // SageMaker Execution Role
    const sagemakerRole = new iam.Role(this, 'SageMakerExecutionRole', {
      roleName: `${props.projectName}-sagemaker-role`,
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    // ControlNet Endpoint (GPU - ml.g4dn.xlarge)
    const controlNetModel = new sagemaker.CfnModel(this, 'ControlNetModel', {
      modelName: `${props.projectName}-controlnet`,
      executionRoleArn: sagemakerRole.roleArn,
      primaryContainer: {
        image: pytorchGpuImage,
        modelDataUrl: `s3://${props.projectName}-models-${this.account}/controlnet/model.tar.gz`,
        environment: {
          SAGEMAKER_PROGRAM: 'inference.py',
          SAGEMAKER_SUBMIT_DIRECTORY: '/opt/ml/model/code',
        },
      },
    });

    const controlNetEndpointConfig = new sagemaker.CfnEndpointConfig(this, 'ControlNetEndpointConfig', {
      endpointConfigName: `${props.projectName}-controlnet-config`,
      productionVariants: [
        {
          modelName: controlNetModel.modelName!,
          variantName: 'AllTraffic',
          initialInstanceCount: 1,
          instanceType: 'ml.g4dn.xlarge',
          initialVariantWeight: 1.0,
        },
      ],
    });
    controlNetEndpointConfig.addDependency(controlNetModel);

    this.controlNetEndpoint = new sagemaker.CfnEndpoint(this, 'ControlNetEndpoint', {
      endpointName: `${props.projectName}-controlnet-endpoint`,
      endpointConfigName: controlNetEndpointConfig.endpointConfigName!,
    });
    this.controlNetEndpoint.addDependency(controlNetEndpointConfig);

    // MiDaS Endpoint (CPU - ml.m5.xlarge for depth estimation)
    const midasModel = new sagemaker.CfnModel(this, 'MidasModel', {
      modelName: `${props.projectName}-midas`,
      executionRoleArn: sagemakerRole.roleArn,
      primaryContainer: {
        image: pytorchCpuImage,
        modelDataUrl: `s3://${props.projectName}-models-${this.account}/midas/model.tar.gz`,
        environment: {
          SAGEMAKER_PROGRAM: 'inference.py',
          SAGEMAKER_SUBMIT_DIRECTORY: '/opt/ml/model/code',
        },
      },
    });

    const midasEndpointConfig = new sagemaker.CfnEndpointConfig(this, 'MidasEndpointConfig', {
      endpointConfigName: `${props.projectName}-midas-config`,
      productionVariants: [
        {
          modelName: midasModel.modelName!,
          variantName: 'AllTraffic',
          initialInstanceCount: 1,
          instanceType: 'ml.m5.xlarge',
          initialVariantWeight: 1.0,
        },
      ],
    });
    midasEndpointConfig.addDependency(midasModel);

    this.midasEndpoint = new sagemaker.CfnEndpoint(this, 'MidasEndpoint', {
      endpointName: `${props.projectName}-midas-endpoint`,
      endpointConfigName: midasEndpointConfig.endpointConfigName!,
    });
    this.midasEndpoint.addDependency(midasEndpointConfig);

    // TripoSR Endpoint (GPU - ml.g4dn.xlarge for image-to-3D)
    const tripoSrModel = new sagemaker.CfnModel(this, 'TripoSrModel', {
      modelName: `${props.projectName}-triposr`,
      executionRoleArn: sagemakerRole.roleArn,
      primaryContainer: {
        image: pytorchGpuImage,
        modelDataUrl: `s3://${props.projectName}-models-${this.account}/triposr/model.tar.gz`,
        environment: {
          SAGEMAKER_PROGRAM: 'inference.py',
          SAGEMAKER_SUBMIT_DIRECTORY: '/opt/ml/model/code',
        },
      },
    });

    const tripoSrEndpointConfig = new sagemaker.CfnEndpointConfig(this, 'TripoSrEndpointConfig', {
      endpointConfigName: `${props.projectName}-triposr-config`,
      productionVariants: [
        {
          modelName: tripoSrModel.modelName!,
          variantName: 'AllTraffic',
          initialInstanceCount: 1,
          instanceType: 'ml.g4dn.xlarge',
          initialVariantWeight: 1.0,
        },
      ],
    });
    tripoSrEndpointConfig.addDependency(tripoSrModel);

    this.tripoSrEndpoint = new sagemaker.CfnEndpoint(this, 'TripoSrEndpoint', {
      endpointName: `${props.projectName}-triposr-endpoint`,
      endpointConfigName: tripoSrEndpointConfig.endpointConfigName!,
    });
    this.tripoSrEndpoint.addDependency(tripoSrEndpointConfig);

    // SDXL / FLUX.1 Endpoint (GPU - standalone alternate-theme preview, FR-4.4)
    const sdxlModel = new sagemaker.CfnModel(this, 'SdxlModel', {
      modelName: `${props.projectName}-sdxl`,
      executionRoleArn: sagemakerRole.roleArn,
      primaryContainer: {
        image: pytorchGpuImage,
        modelDataUrl: `s3://${props.projectName}-models-${this.account}/sdxl/model.tar.gz`,
        environment: {
          SAGEMAKER_PROGRAM: 'inference.py',
          SAGEMAKER_SUBMIT_DIRECTORY: '/opt/ml/model/code',
        },
      },
    });

    const sdxlEndpointConfig = new sagemaker.CfnEndpointConfig(this, 'SdxlEndpointConfig', {
      endpointConfigName: `${props.projectName}-sdxl-config`,
      productionVariants: [
        {
          modelName: sdxlModel.modelName!,
          variantName: 'AllTraffic',
          initialInstanceCount: 1,
          instanceType: 'ml.g4dn.xlarge',
          initialVariantWeight: 1.0,
        },
      ],
    });
    sdxlEndpointConfig.addDependency(sdxlModel);

    this.sdxlEndpoint = new sagemaker.CfnEndpoint(this, 'SdxlEndpoint', {
      endpointName: `${props.projectName}-sdxl-endpoint`,
      endpointConfigName: sdxlEndpointConfig.endpointConfigName!,
    });
    this.sdxlEndpoint.addDependency(sdxlEndpointConfig);

    // Auto-scaling for ControlNet (scale to 0 when idle)
    const scalingTarget = new applicationautoscaling.ScalableTarget(this, 'ControlNetScaling', {
      serviceNamespace: applicationautoscaling.ServiceNamespace.SAGEMAKER,
      resourceId: `endpoint/${this.controlNetEndpoint.endpointName}/variant/AllTraffic`,
      scalableDimension: 'sagemaker:variant:DesiredInstanceCount',
      minCapacity: 0,
      maxCapacity: 1,
    });
    scalingTarget.node.addDependency(this.controlNetEndpoint);

    scalingTarget.scaleToTrackMetric('InvocationsTracking', {
      targetValue: 1,
      predefinedMetric: applicationautoscaling.PredefinedMetric.SAGEMAKER_VARIANT_INVOCATIONS_PER_INSTANCE,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(1),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ControlNetEndpointName', {
      value: this.controlNetEndpoint.endpointName!,
      exportName: `${props.projectName}-controlnet-endpoint`,
    });

    new cdk.CfnOutput(this, 'MidasEndpointName', {
      value: this.midasEndpoint.endpointName!,
      exportName: `${props.projectName}-midas-endpoint`,
    });

    new cdk.CfnOutput(this, 'TripoSrEndpointName', {
      value: this.tripoSrEndpoint.endpointName!,
      exportName: `${props.projectName}-triposr-endpoint`,
    });

    new cdk.CfnOutput(this, 'SdxlEndpointName', {
      value: this.sdxlEndpoint.endpointName!,
      exportName: `${props.projectName}-sdxl-endpoint`,
    });
  }
}
