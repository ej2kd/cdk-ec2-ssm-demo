#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkEc2SsmDemoStack } from '../lib/cdk-ec2-ssm-demo-stack';

const app = new cdk.App();
new CdkEc2SsmDemoStack(app, 'CdkEc2SsmDemoStack');
