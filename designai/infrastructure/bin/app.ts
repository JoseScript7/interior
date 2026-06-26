#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../stacks/network-stack';
import { DataStack } from '../stacks/data-stack';
import { AuthStack } from '../stacks/auth-stack';
import { AiStack } from '../stacks/ai-stack';
import { ApiStack } from '../stacks/api-stack';
import { PipelineStack } from '../stacks/pipeline-stack';

const app = new cdk.App();

const env = {
  account: app.node.tryGetContext('accountId') || process.env.CDK_DEFAULT_ACCOUNT,
  region: app.node.tryGetContext('region') || 'us-east-1',
};

const projectName = app.node.tryGetContext('projectName') || 'designai';

// Stack 1: Network (VPC, Security Groups)
const networkStack = new NetworkStack(app, `${projectName}-network`, {
  env,
  projectName,
});

// Stack 2: Data (S3, DynamoDB, OpenSearch, ElastiCache)
const dataStack = new DataStack(app, `${projectName}-data`, {
  env,
  projectName,
  vpc: networkStack.vpc,
});

// Stack 3: Auth (Cognito)
const authStack = new AuthStack(app, `${projectName}-auth`, {
  env,
  projectName,
});

// Stack 4: AI (SageMaker endpoints)
const aiStack = new AiStack(app, `${projectName}-ai`, {
  env,
  projectName,
  vpc: networkStack.vpc,
});

// Stack 5: API (API Gateway, Lambda, SQS, WebSocket)
const apiStack = new ApiStack(app, `${projectName}-api`, {
  env,
  projectName,
  vpc: networkStack.vpc,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  projectsTable: dataStack.projectsTable,
  uploadsBucket: dataStack.uploadsBucket,
  rendersBucket: dataStack.rendersBucket,
  assetsBucket: dataStack.assetsBucket,
});

// Stack 6: Pipeline (Step Functions, EventBridge)
const pipelineStack = new PipelineStack(app, `${projectName}-pipeline`, {
  env,
  projectName,
  vpc: networkStack.vpc,
  projectsTable: dataStack.projectsTable,
  uploadsBucket: dataStack.uploadsBucket,
  rendersBucket: dataStack.rendersBucket,
  assetsBucket: dataStack.assetsBucket,
});

app.synth();
