import type { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import type { TShallotErrorHandlerOptions } from '@shallot/http-error-handler/dist/aws';

import ShallotAWS, { ShallotAWSHandler } from '@shallot/aws';
import { ShallotAWSHttpErrorHandler } from '@shallot/http-error-handler';

import ShallotAWSSocketJsonBodyParser, {
  TShallotJSONBodyParserOptions,
} from './json-body-parser';

export type WebSocketRequestContext<TAuthorizer = unknown> =
  APIGatewayProxyEvent['requestContext'] & {
    connectionId: string;
    authorizer: TAuthorizer;
  };

export type APIGatewayWebSocketEvent<TAuthorizer = unknown> = APIGatewayProxyEvent & {
  requestContext: WebSocketRequestContext<TAuthorizer>;
};

type ParsedJSON = Record<string | number | symbol, unknown>;
export type RequestDataBase = ParsedJSON | unknown;
export type ResultDataBase = ParsedJSON | Array<ParsedJSON> | unknown;

export type ShallotRawHandler<TEvent extends TShallotSocketEvent = TShallotSocketEvent> =
  Handler<TEvent, void>;

export type TShallotSocketEvent<
  TQueryStringParameters extends RequestDataBase = unknown,
  TPathParameters extends RequestDataBase = unknown,
  THeaders extends RequestDataBase = unknown,
  TBody extends RequestDataBase = unknown,
  TAuthorizer = unknown
> = Omit<
  Omit<
    Omit<Omit<APIGatewayWebSocketEvent<TAuthorizer>, 'body'>, 'queryStringParameters'>,
    'pathParameters'
  >,
  'headers'
> & {
  queryStringParameters?: TQueryStringParameters;
  pathParameters?: TPathParameters;
  headers?: THeaders;
  body?: TBody;
};

type TShallotSocketHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: ShallotRawHandler<any>,
  successStatusCode?: number,
  middlewareOpts?: {
    HttpErrorHandlerOpts?: TShallotErrorHandlerOptions;
    HttpJsonBodyParserOpts?: TShallotJSONBodyParserOptions;
  }
) => ShallotAWSHandler<TShallotSocketEvent>;

const ShallotSocketWrapper: TShallotSocketHandler = (
  handler,
  successStatusCode = 200,
  middlewareOpts = {}
) => {
  const wrappedResponseHandler: Handler = async (...args) => {
    const res = await handler(...args);
    return {
      statusCode: successStatusCode,
      body: JSON.stringify(res),
    };
  };

  const wrapper = ShallotAWS(wrappedResponseHandler)
    .use(ShallotAWSSocketJsonBodyParser(middlewareOpts.HttpJsonBodyParserOpts))
    .use(ShallotAWSHttpErrorHandler(middlewareOpts.HttpErrorHandlerOpts));

  return wrapper;
};

export default ShallotSocketWrapper;
