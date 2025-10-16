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
  
  switch (platform) {
    case Platform.WHATSAPP:
      return handleWhatsAppVerification(queryParams);
    case Platform.FACEBOOK:
      return handleFacebookVerification(queryParams);
    case Platform.INSTAGRAM:
      return handleInstagramVerification(queryParams);
    case Platform.TELEGRAM:
      return handleTelegramVerification(queryParams);
    default:
      return errorResponse(`Verification not implemented for ${platform}`, 501);
  }
}

function handleWhatsAppVerification(queryParams: any): APIGatewayProxyResult {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const hubMode = queryParams['hub.mode'];
  const hubChallenge = queryParams['hub.challenge'];
  const hubVerifyToken = queryParams['hub.verify_token'];

  if (hubMode === 'subscribe' && hubVerifyToken === verifyToken) {
    console.log('WhatsApp webhook verified');
    return successResponse(hubChallenge);
  }
  
  return errorResponse('WhatsApp verification failed', 401);
}

function handleFacebookVerification(queryParams: any): APIGatewayProxyResult {
  const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN;
  const hubMode = queryParams['hub.mode'];
  const hubChallenge = queryParams['hub.challenge'];
  const hubVerifyToken = queryParams['hub.verify_token'];

  if (hubMode === 'subscribe' && hubVerifyToken === verifyToken) {
    console.log('Facebook webhook verified');
    return successResponse(hubChallenge);
  }
  
  return errorResponse('Facebook verification failed', 401);
}

function handleInstagramVerification(queryParams: any): APIGatewayProxyResult {
  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN;
  const hubMode = queryParams['hub.mode'];
  const hubChallenge = queryParams['hub.challenge'];
  const hubVerifyToken = queryParams['hub.verify_token'];

  if (hubMode === 'subscribe' && hubVerifyToken === verifyToken) {
    console.log('Instagram webhook verified');
    return successResponse(hubChallenge);
  }
  
  return errorResponse('Instagram verification failed', 401);
}

function handleTelegramVerification(queryParams: any): APIGatewayProxyResult {
  // Telegram doesn't require webhook verification
  // Just return OK for any GET request
  console.log('Telegram webhook verification (no verification required)');
  return successResponse('OK');
}

async function handleWebhookEvent(
  event: APIGatewayProxyEvent,
  platform: Platform
): Promise<APIGatewayProxyResult> {
  const payload = JSON.parse(event.body || '{}');
  const signature = event.headers['X-Hub-Signature-256'] || 
                   event.headers['X-Hub-Signature'] ||
                   event.headers['X-Telegram-Bot-Api-Secret-Token'];
  
  console.log(`Received ${platform} webhook:`, JSON.stringify(payload, null, 2));
  
  // Validate webhook signature
  if (!validateWebhookSignature(platform, payload, signature, event.headers)) {
    console.warn(`${platform} webhook signature validation failed`);
    return errorResponse('Invalid webhook signature', 401);
  }
  
  // Initialize clients
  const dbClient = new DatabaseClient();
  const queueClient = new QueueClient();
  
  // TODO: 
  // 1. Parse platform-specific message format
  // 2. Store message in Aurora PostgreSQL using dbClient.insertMessage()
  // 3. Queue message for processing using queueClient.sendMessageForProcessing()
  
  return successResponse({
    message: 'Webhook received successfully',
    platform,
    processed: false // Will be true once implemented
  });
}

function validateWebhookSignature(
  platform: Platform, 
  payload: any, 
  signature: string | undefined,
  headers: any
): boolean {
  // TODO: Implement platform-specific signature validation
  // For now, return true to allow development
  // In production, implement proper signature validation for each platform
  
  switch (platform) {
    case Platform.WHATSAPP:
      // TODO: Validate WhatsApp signature using X-Hub-Signature-256
      return true;
    case Platform.FACEBOOK:
      // TODO: Validate Facebook signature using X-Hub-Signature-256
      return true;
    case Platform.INSTAGRAM:
      // TODO: Validate Instagram signature using X-Hub-Signature-256
      return true;
    case Platform.TELEGRAM:
      // TODO: Validate Telegram signature using X-Telegram-Bot-Api-Secret-Token
      return true;
    default:
      return false;
  }
}
