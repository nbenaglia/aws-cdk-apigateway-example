import * as cdk from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import lambda = require('@aws-cdk/aws-lambda');
import apigw = require('@aws-cdk/aws-apigateway');

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hi_handler = new lambda.Function(this, 'handler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline(
        'exports.handler = function(event, ctx, cb) { return cb(null, "hello"); }'
      ),
      handler: 'index.handler',
    });

    const apigatewayRest = new apigw.LambdaRestApi(this, 'hello-endpoint', {
      handler: hi_handler
    });

    const importedLambda = lambda.Function.fromFunctionArn(
      this, 'my-imported-lambda', hi_handler.functionArn
    )

    const jwtAuthorizer = new apigw.TokenAuthorizer(this, 'api-authorizer', {
      handler: importedLambda,
      authorizerName: 'api-authorizer',
    })

    importedLambda.addPermission('api gateway allow', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: jwtAuthorizer.authorizerArn
    })
  }
}
