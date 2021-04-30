import type { Context } from 'aws-lambda';

import { test, describe, jest } from '@jest/globals';

import ShallotAWSSocketWrapper from '../src';
import type { ShallotRawHandler, TShallotSocketEvent } from '../src';

describe('WebSocket Wrapper', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: '',
    functionVersion: '',
    invokedFunctionArn: '',
    memoryLimitInMB: '',
    awsRequestId: '',
    logGroupName: '',
    logStreamName: '',
    getRemainingTimeInMillis: () => 0,
    done: () => undefined,
    fail: () => undefined,
    succeed: () => undefined,
  };

  type MockEvent = TShallotSocketEvent<{ test: string }>;
  const mockHandler: ShallotRawHandler<MockEvent> = async () => undefined;

  test('Smoke test CORS default usage', async () => {
    const wrappedHandler = ShallotAWSSocketWrapper(mockHandler);

    const mockEvent: MockEvent = {} as unknown as MockEvent;
    await wrappedHandler(mockEvent, mockContext, jest.fn());
  });
});
