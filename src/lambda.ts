import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { Server } from 'http';
import { createServer, proxy } from 'aws-serverless-express';
import { bootstrapServer } from './bootstrapServer';

let cachedServer: Server;

async function initializeServer(): Promise<Server> {
  if (!cachedServer) {
    const server = await bootstrapServer();
    cachedServer = createServer(server);
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

    return await proxy(server, event, context);
  } catch (error) {
    // Create a type guard for custom errors that might have a body property
    interface ErrorWithBody {
      message: string;
      body?: unknown;
    }

    // Type guard function to check if error is ErrorWithBody
    function isErrorWithBody(err: unknown): err is ErrorWithBody {
      return (
        err !== null && typeof err === 'object' && 'message' in err && true
      );
    }

    let errorMessage = 'Unknown error occurred';
    let errorBody: unknown = null;

    if (isErrorWithBody(error)) {
      errorMessage = error.message;
      errorBody = error.body;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: errorMessage,
        error: errorBody,
      }),
    };
  }
};
