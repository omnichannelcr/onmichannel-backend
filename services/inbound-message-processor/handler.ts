import { SQSEvent, SQSRecord } from 'aws-lambda';
import { QueueMessage, Platform } from '@/shared/types';
import { DatabaseClient } from '@/shared/database';
import { QueueClient } from '@/shared/queue';
import { WebSocketNotifier } from '@/shared/websocket-notifier';

interface ProcessingResult {
  messageId: string;
  status: 'success' | 'failed';
  platform?: Platform;
  error?: string;
}

export const messageProcessor = async (event: SQSEvent): Promise<{
  processedCount: number;
  results: ProcessingResult[];
}> => {
  console.log('Processing SQS messages:', JSON.stringify(event, null, 2));
  
  // Initialize clients
  const dbClient = new DatabaseClient();
  const queueClient = new QueueClient();
  const webSocketNotifier = new WebSocketNotifier();
  
  const results: ProcessingResult[] = [];
  
  for (const record of event.Records) {
    try {
      const messageBody: QueueMessage = JSON.parse(record.body);
      
      console.log('Processing message:', messageBody);
      
      // 1. Parse queue message
      const messageData = parseQueueMessage(messageBody);
      
      // 2. Process message (normalize, enrich, etc.)
      const processedMessage = await processMessage(messageData, dbClient);
      
      // 3. Send WebSocket notification to connected users
      await notifyWebSocketUsers(processedMessage, webSocketNotifier);
      
      // 4. Update processing status in database
      await dbClient.logQueueProcessing(
        processedMessage.id,
        record.messageId,
        'success'
      );
      
      results.push({
        messageId: record.messageId,
        status: 'success',
        platform: messageBody.platform
      });
      
    } catch (error) {
      console.error('Failed to process message:', error);
      results.push({
        messageId: record.messageId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return {
    processedCount: results.length,
    results
  };
};

// Helper functions
function parseQueueMessage(queueMessage: QueueMessage): any {
  // TODO: Implement platform-specific message parsing
  // This should convert the queue message into a standardized format
  console.log('Parsing queue message:', queueMessage);
  
  return {
    platform: queueMessage.platform,
    platformMessageId: queueMessage.platformMessageId,
    content: queueMessage.content,
    contact: queueMessage.contact,
    metadata: queueMessage.metadata,
    timestamp: queueMessage.timestamp
  };
}

async function processMessage(messageData: any, dbClient: DatabaseClient): Promise<any> {
  // TODO: Implement message processing logic
  // This should:
  // 1. Normalize the message format
  // 2. Enrich with additional data (user info, conversation context, etc.)
  // 3. Store in database
  // 4. Return processed message with all necessary data for notifications
  
  console.log('Processing message:', messageData);
  
  // For now, return a mock processed message
  const processedMessage = {
    id: `msg_${Date.now()}`,
    platform: messageData.platform,
    direction: 'inbound',
    content: messageData.content,
    contact: messageData.contact,
    conversationId: `conv_${messageData.contact?.id || 'unknown'}`,
    // TODO: Determine userId and companyId based on business logic
    userId: 'user_123', // This should be determined from conversation assignment
    companyId: 'company_456', // This should be determined from user's company
    timestamp: messageData.timestamp || new Date().toISOString()
  };
  
  // Store message in database
  await dbClient.insertMessage({
    platform: processedMessage.platform,
    platform_message_id: messageData.platformMessageId,
    conversation_id: processedMessage.conversationId,
    contact_id: messageData.contact?.id,
    direction: processedMessage.direction,
    content_type: 'text',
    content_text: typeof messageData.content === 'string' ? messageData.content : JSON.stringify(messageData.content),
    content_json: messageData.content,
    metadata: messageData.metadata
  });
  
  return processedMessage;
}

async function notifyWebSocketUsers(processedMessage: any, webSocketNotifier: WebSocketNotifier): Promise<void> {
  try {
    // Send notification about new message
    await webSocketNotifier.notifyNewMessage(processedMessage);
    
    console.log(`WebSocket notification sent for message ${processedMessage.id}`);
  } catch (error) {
    console.error('Failed to send WebSocket notification:', error);
    // Don't throw error - message processing should continue even if notification fails
  }
}
