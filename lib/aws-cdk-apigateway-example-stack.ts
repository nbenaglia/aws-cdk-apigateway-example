import * as cdk from '@aws-cdk/core';
import iam = require('@aws-cdk/aws-iam');
import lambda = require('@aws-cdk/aws-lambda');
import apigw = require('@aws-cdk/aws-apigateway');

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const helloHandler = new lambda.Function(this, 'helloHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline(
        'exports.handler = function(event, ctx, cb) { return cb(null, "hello"); }'
      ),
      handler: 'index.handler',
    });


    const authorizerLambda = new lambda.Function(this, 'authorizerHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline(
        'exports.handler = function(event, ctx, cb) { return cb(null, "authorizer"); }'
      ),
      handler: 'index.handler',
    });

    // API Gateway
    const myApi = new apigw.RestApi(this, 'my-api-gw',
      {
        apiKeySourceType: apigw.ApiKeySourceType.AUTHORIZER,
        restApiName: 'my-api',
        deploy: true,
        endpointConfiguration: {
          types: [apigw.EndpointType.REGIONAL],
        },
        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['execute-api:*'],
              resources: ['execute-api:/*'],
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.AnyPrincipal()
              ],
            }),
          ]
        })
      }
    );

    const importedLambda = lambda.Function.fromFunctionArn(
      this, 'my-imported-lambda', helloHandler.functionArn
    )

    const myAuthorizer = new apigw.TokenAuthorizer(this, 'api-authorizer', {
      handler: authorizerLambda,
      authorizerName: 'api-authorizer',
    })

    importedLambda.addPermission('api gateway allow', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: myAuthorizer.authorizerArn
    })

   const resource = myApi.root.addResource('endpoint')
   resource.addMethod('')

   myApi.root.addProxy({
    defaultIntegration: new apigw.MockIntegration(),
    defaultMethodOptions: {
      authorizer: myAuthorizer,
      requestParameters: {
        'method.request.path.proxy': true
      }
    },
  });
  }
}
