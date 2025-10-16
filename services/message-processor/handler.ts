import { SQSEvent, SQSRecord } from 'aws-lambda';
import { QueueMessage, Platform } from '@/shared/types';
import { DatabaseClient } from '@/shared/database';
import { QueueClient } from '@/shared/queue';

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
  
  const results: ProcessingResult[] = [];
  
  for (const record of event.Records) {
    try {
      const messageBody: QueueMessage = JSON.parse(record.body);
      
      console.log('Processing message:', messageBody);
      
      // TODO: 
      // 1. Parse queue message
      // 2. Process message (normalize, enrich, etc.)
      // 3. Send to UI (WebSocket, API, etc.)
      // 4. Update processing status in database using dbClient.logQueueProcessing()
      
      results.push({
        messageId: record.messageId,
        status: 'success', // Will be 'success' or 'failed' once implemented
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
