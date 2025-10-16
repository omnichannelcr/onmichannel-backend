import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Platform } from '@/shared/types';
import { successResponse, errorResponse } from '@/shared/utils';
import { DatabaseClient } from '@/shared/database';
import { QueueClient } from '@/shared/queue';
import { PlatformClients, OutboundMessage } from '@/shared/platform-clients';
import { WebSocketNotifier } from '@/shared/websocket-notifier';

export const outboundMessageProcessor = async (
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

    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const { conversationId, content, metadata } = requestBody;

    if (!conversationId || !content) {
      return errorResponse('conversationId and content are required', 400);
    }

    // Create outbound message
    const outboundMessage: OutboundMessage = {
      platform: platform as Platform,
      conversationId,
      content,
      metadata
    };

    console.log('Sending outbound message:', outboundMessage);

    // Initialize clients
    const dbClient = new DatabaseClient();
    const queueClient = new QueueClient();
    const platformClients = new PlatformClients();
    const webSocketNotifier = new WebSocketNotifier();

    // TODO: 
    // 1. Store outbound message in database (direction: 'outbound')
    // 2. Send message via platform API
    // 3. Update message status in database
    // 4. Queue for processing/status updates

    // Send message to platform
    const sendResult = await platformClients.sendMessage(outboundMessage);
    
    if (!sendResult.success) {
      return errorResponse(`Failed to send message: ${sendResult.error}`, 500);
    }

    // Store outbound message in database
    const messageId = await dbClient.insertMessage({
      platform: platform as string,
      platform_message_id: sendResult.messageId,
      conversation_id: conversationId,
      direction: 'outbound',
      content_type: 'text',
      content_text: typeof content === 'string' ? content : JSON.stringify(content),
      content_json: content,
      metadata
    });

    // Send WebSocket notification to other connected users (not the sender)
    try {
      await webSocketNotifier.notifyOutboundMessage({
        id: messageId,
        platform: platform as string,
        direction: 'outbound',
        content,
        conversationId,
        senderUserId: requestBody.userId,
        companyId: requestBody.companyId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send WebSocket notification for outbound message:', error);
      // Don't fail the entire operation if notification fails
    }

    return successResponse({
      message: 'Message sent successfully',
      platform,
      messageId: sendResult.messageId,
      conversationId
    });

  } catch (error) {
    console.error('Outbound handler error:', error);
    return errorResponse('Internal server error', 500);
  }
};
