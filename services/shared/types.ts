// Platform types
export enum Platform {
  WHATSAPP = 'whatsapp',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TELEGRAM = 'telegram'
}

// Message direction
export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

// Content types
export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact'
}

// Unified message format for internal processing
export interface UnifiedMessage {
  id: string;
  platform: Platform;
  platformMessageId: string;
  conversationId: string;
  contactId: string;
  direction: MessageDirection;
  contentType: ContentType;
  contentText?: string;
  contentJson?: any;
  metadata: Record<string, any>;
  createdAt: string;
}

// Database message model
export interface Message {
  id: string;
  platform: string;
  platform_message_id: string;
  conversation_id?: string;
  contact_id?: string;
  direction: string;
  content_type: string;
  content_text?: string;
  content_json?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// Webhook event from platforms
export interface WebhookEvent {
  platform: Platform;
  eventType: string;
  payload: any;
  signature?: string;
  timestamp: string;
}

// SQS Queue message
export interface QueueMessage {
  id: string;
  messageId: string;
  platform: Platform;
  action: 'process_message' | 'send_notification';
  payload: any;
  timestamp: string;
  retryCount?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

export interface ApiEvent {
  httpMethod: string;
  path: string;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body?: string;
  headers?: Record<string, string>;
  requestContext?: {
    requestId: string;
    identity?: {
      sourceIp: string;
      userAgent?: string;
    };
  };
}
