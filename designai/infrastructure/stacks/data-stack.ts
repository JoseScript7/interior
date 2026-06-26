import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

export interface DataStackProps extends cdk.StackProps {
  projectName: string;
  vpc: ec2.IVpc;
}

export class DataStack extends cdk.Stack {
  public readonly uploadsBucket: s3.Bucket;
  public readonly rendersBucket: s3.Bucket;
  public readonly assetsBucket: s3.Bucket;
  public readonly projectsTable: dynamodb.Table;
  public readonly assetsDistribution: cloudfront.Distribution;
  public readonly redisCache: elasticache.CfnCacheCluster;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // S3 Buckets
    this.uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `${props.projectName}-uploads-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    this.rendersBucket = new s3.Bucket(this, 'RendersBucket', {
      bucketName: `${props.projectName}-renders-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `${props.projectName}-assets-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // CloudFront distribution for 3D assets
    this.assetsDistribution = new cloudfront.Distribution(this, 'AssetsDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.assetsBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      comment: `${props.projectName} 3D assets CDN`,
    });

    // DynamoDB Table — Single-table design
    this.projectsTable = new dynamodb.Table(this, 'ProjectsTable', {
      tableName: `${props.projectName}-projects`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      timeToLiveAttribute: 'TTL',
    });

    // GSI: Query by status
    this.projectsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-Status',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI: Query by creation date
    this.projectsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-Date',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ElastiCache for Redis — session state, recommendation cache, temp embeddings
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: `${props.projectName} redis subnet group`,
      subnetIds: props.vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }).subnetIds,
      cacheSubnetGroupName: `${props.projectName}-redis-subnets`,
    });

    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: props.vpc,
      description: 'DesignAI Redis access',
      allowAllOutbound: true,
    });
    redisSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis from within VPC'
    );

    this.redisCache = new elasticache.CfnCacheCluster(this, 'RedisCache', {
      clusterName: `${props.projectName}-redis`,
      engine: 'redis',
      cacheNodeType: 'cache.t3.micro',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
    });
    this.redisCache.addDependency(redisSubnetGroup);

    // Outputs
    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: this.uploadsBucket.bucketName,
      exportName: `${props.projectName}-uploads-bucket`,
    });

    new cdk.CfnOutput(this, 'RendersBucketName', {
      value: this.rendersBucket.bucketName,
      exportName: `${props.projectName}-renders-bucket`,
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: this.assetsBucket.bucketName,
      exportName: `${props.projectName}-assets-bucket`,
    });

    new cdk.CfnOutput(this, 'AssetsDistributionDomain', {
      value: this.assetsDistribution.distributionDomainName,
      exportName: `${props.projectName}-assets-cdn`,
    });

    new cdk.CfnOutput(this, 'ProjectsTableName', {
      value: this.projectsTable.tableName,
      exportName: `${props.projectName}-projects-table`,
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisCache.attrRedisEndpointAddress,
      exportName: `${props.projectName}-redis-endpoint`,
    });
  }
}
