import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Platform } from '@/shared/types';
import { successResponse, errorResponse } from '@/shared/utils';
import { DatabaseClient } from '@/shared/database';
import { QueueClient } from '@/shared/queue';

export const webhookHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const platform = event.pathParameters?.platform?.toLowerCase();
    
    if (!platform) {
      return errorResponse('Platform parameter is required', 400);
    }

    // Validate platform
    const supportedPlatforms = Object.values(Platform);
    if (!supportedPlatforms.includes(platform as Platform)) {
      return errorResponse(`Unsupported platform: ${platform}`, 400);
    }

    // Handle GET requests (webhook verification)
    if (event.httpMethod === 'GET') {
      return handleWebhookVerification(event, platform as Platform);
    }

    // Handle POST requests (webhook events)
    if (event.httpMethod === 'POST') {
      return handleWebhookEvent(event, platform as Platform);
    }

    return errorResponse(`Method ${event.httpMethod} not allowed`, 405);

  } catch (error) {
    console.error('Webhook handler error:', error);
    return errorResponse('Internal server error', 500);
  }
};

async function handleWebhookVerification(
  event: APIGatewayProxyEvent, 
  platform: Platform
): Promise<APIGatewayProxyResult> {
  const queryParams = event.queryStringParameters || {};
  
  // Simple verification for now
  const hubMode = queryParams['hub.mode'];
  const hubChallenge = queryParams['hub.challenge'];
  
  if (hubMode === 'subscribe' && hubChallenge) {
    console.log(`${platform} webhook verified`);
    return successResponse(hubChallenge);
  }
  
  return errorResponse('Verification failed', 401);
}

async function handleWebhookEvent(
  event: APIGatewayProxyEvent,
  platform: Platform
): Promise<APIGatewayProxyResult> {
  const payload = JSON.parse(event.body || '{}');
  
  console.log(`Received ${platform} webhook:`, JSON.stringify(payload, null, 2));
  
  // Initialize clients
  const dbClient = new DatabaseClient();
  const queueClient = new QueueClient();
  
  // TODO: 
  // 1. Validate webhook signature
  // 2. Parse platform-specific message format
  // 3. Store message in Aurora PostgreSQL using dbClient.insertMessage()
  // 4. Queue message for processing using queueClient.sendMessageForProcessing()
  
  return successResponse({
    message: 'Webhook received successfully',
    platform,
    processed: false // Will be true once implemented
  });
}
