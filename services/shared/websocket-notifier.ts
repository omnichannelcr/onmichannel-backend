import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DatabaseClient } from './database';

export interface WebSocketNotification {
  type: string;
  data: any;
  timestamp: string;
  messageId?: string;
  conversationId?: string;
  userId?: string;
  companyId?: string;
}

export class WebSocketNotifier {
  private dbClient: DatabaseClient;
  private apiGatewayClient: ApiGatewayManagementApiClient;

  constructor() {
    this.dbClient = new DatabaseClient();
    
    // Initialize API Gateway Management API client
    const endpoint = `https://${process.env.WEBSOCKET_API_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com/${process.env.STAGE}`;
    this.apiGatewayClient = new ApiGatewayManagementApiClient({ endpoint });
  }

  async notifyUser(userId: string, notification: WebSocketNotification): Promise<void> {
    try {
      // Get user's active WebSocket connections
      const connections = await this.dbClient.getUserWebSocketConnections(userId);
      
      console.log(`Notifying user ${userId} on ${connections.length} connections`);
      
      // Send notification to all user's connections
      for (const connection of connections) {
        await this.sendToConnection(connection.connection_id, notification);
      }
    } catch (error) {
      console.error(`Failed to notify user ${userId}:`, error);
    }
  }

  async notifyCompany(companyId: string, notification: WebSocketNotification): Promise<void> {
    try {
      // Get company's active WebSocket connections
      const connections = await this.dbClient.getCompanyWebSocketConnections(companyId);
      
      console.log(`Notifying company ${companyId} on ${connections.length} connections`);
      
      // Send notification to all company's connections
      for (const connection of connections) {
        await this.sendToConnection(connection.connection_id, notification);
      }
    } catch (error) {
      console.error(`Failed to notify company ${companyId}:`, error);
    }
  }

  async notifySpecificConnections(connectionIds: string[], notification: WebSocketNotification): Promise<void> {
    try {
      console.log(`Notifying ${connectionIds.length} specific connections`);
      
      // Send notification to specific connections
      for (const connectionId of connectionIds) {
        await this.sendToConnection(connectionId, notification);
      }
    } catch (error) {
      console.error(`Failed to notify specific connections:`, error);
    }
  }

  private async sendToConnection(connectionId: string, notification: WebSocketNotification): Promise<void> {
    try {
      await this.apiGatewayClient.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify(notification)
      }));
      
      console.log(`Notification sent to connection ${connectionId}:`, notification.type);
    } catch (error) {
      console.error(`Failed to send notification to connection ${connectionId}:`, error);
      
      // If connection is stale, mark it as disconnected
      if (error instanceof Error && error.message.includes('410')) {
        console.log(`Connection ${connectionId} is stale, marking as disconnected`);
        await this.dbClient.disconnectWebSocketConnection(connectionId);
      }
    }
  }

  // Helper method for common notification types
  async notifyNewMessage(messageData: any): Promise<void> {
    const notification: WebSocketNotification = {
      type: 'new_message',
      data: {
        id: messageData.id,
        platform: messageData.platform,
        direction: messageData.direction,
        content: messageData.content,
        contact: messageData.contact,
        conversationId: messageData.conversationId
      },
      timestamp: new Date().toISOString(),
      messageId: messageData.id,
      conversationId: messageData.conversationId
    };

    // TODO: Determine who to notify based on message routing logic
    // For now, we'll need the message data to include userId or companyId
    if (messageData.userId) {
      await this.notifyUser(messageData.userId, notification);
    } else if (messageData.companyId) {
      await this.notifyCompany(messageData.companyId, notification);
    } else {
      console.warn('No userId or companyId found in message data, cannot send notification');
    }
  }

  async notifyMessageStatus(messageId: string, status: string, userId?: string, companyId?: string): Promise<void> {
    const notification: WebSocketNotification = {
      type: 'message_status',
      data: {
        messageId,
        status
      },
      timestamp: new Date().toISOString(),
      messageId
    };

    if (userId) {
      await this.notifyUser(userId, notification);
    } else if (companyId) {
      await this.notifyCompany(companyId, notification);
    }
  }
}
