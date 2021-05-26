import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import type { TShallotErrorHandlerOptions } from '@shallot/http-error-handler/dist/aws';

import ShallotAWS, { ShallotAWSHandler } from '@shallot/aws';
import { ShallotAWSHttpErrorHandler } from '@shallot/http-error-handler';

import ShallotAWSSocketJsonBodyParser, {
  TShallotJSONBodyParserOptions,
} from './json-body-parser';

export type WebSocketRequestContext<TAuthorizer extends RequestDataBase = unknown> =
  APIGatewayProxyEvent['requestContext'] & {
    connectionId: string;
    authorizer: TAuthorizer;
  };

export type APIGatewayWebSocketEvent<TAuthorizer extends RequestDataBase = unknown> =
  APIGatewayProxyEvent & {
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
  TAuthorizer extends RequestDataBase = unknown
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

const ShallotSocketWrapper = <TEvent extends TShallotSocketEvent = TShallotSocketEvent>(
  handler: ShallotRawHandler<TEvent>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _successStatusCode = 200,
  middlewareOpts: {
    HttpErrorHandlerOpts?: TShallotErrorHandlerOptions;
    HttpJsonBodyParserOpts?: TShallotJSONBodyParserOptions;
  } = {}
): ShallotAWSHandler<TEvent, APIGatewayProxyResult> => {
  const wrappedResponseHandler: Handler = async (...args) => {
    await handler(...args);
  };

  const wrapper = ShallotAWS(wrappedResponseHandler)
    .use(ShallotAWSSocketJsonBodyParser(middlewareOpts.HttpJsonBodyParserOpts))
    .use(ShallotAWSHttpErrorHandler(middlewareOpts.HttpErrorHandlerOpts));

  return wrapper;
};

export default ShallotSocketWrapper;
