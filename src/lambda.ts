import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { Server } from 'http';
import { proxy } from 'aws-serverless-express';
import { bootstrapServer } from './bootstrapServer';

let cachedServer: Server;

async function initializeServer(): Promise<Server> {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return cachedServer;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    const server = await initializeServer();
    context.callbackWaitsForEmptyEventLoop = false;

    let parsedBody: unknown = null;
    if (event.body) {
      try {
        parsedBody = JSON.parse(event.body);
      } catch {
        parsedBody = event.body;
      }
    }
    console.log('Parsed body:', parsedBody);

    const proxiedResponse = proxy(server, event, context, 'PROMISE');
    const result = await (proxiedResponse as { promise: Promise<APIGatewayProxyResult> }).promise;
    return result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errorBody = 'body' in error ? (error as { body?: unknown }).body : null;
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: error.message,
          error: errorBody,
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Unknown error occurred',
        error: null,
      }),
    };
  }
};