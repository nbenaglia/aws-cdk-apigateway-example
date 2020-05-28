#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ApiGatewayStack } from '../lib/aws-apigateway-example-stack';

const app = new cdk.App();
new ApiGatewayStack(app, 'ApigatewayStack');
