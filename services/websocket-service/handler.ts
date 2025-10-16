import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DatabaseClient } from '@/shared/database';

const dbClient = new DatabaseClient();

// Initialize API Gateway Management API client
const getApiGatewayClient = () => {
  const endpoint = `https://${process.env.WEBSOCKET_API_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com/${process.env.STAGE}`;
  return new ApiGatewayManagementApiClient({ endpoint });
};

export const connect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;
  const userId = event.queryStringParameters?.userId;
  const companyId = event.queryStringParameters?.companyId;
  
  console.log('WebSocket connect:', { connectionId, userId, companyId });
  
  if (!userId || !companyId) {
    console.error('Missing userId or companyId in connection request');
    return { statusCode: 400, body: 'Missing userId or companyId' };
  }
  
  try {
    // Store connection in Aurora PostgreSQL
    await dbClient.storeWebSocketConnection(connectionId, userId, companyId);
    
    console.log('WebSocket connection stored successfully:', connectionId);
    
    // Send welcome message
    const apiGateway = getApiGatewayClient();
    await apiGateway.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify({
        type: 'connected',
        message: 'Connected to omnichannel messaging system',
        connectionId,
        timestamp: new Date().toISOString()
      })
    }));
    
    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('Failed to store WebSocket connection:', error);
    return { statusCode: 500, body: 'Connection failed' };
  }
};

export const disconnect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;
  
  console.log('WebSocket disconnect:', connectionId);
  
  try {
    // Mark connection as disconnected
    await dbClient.disconnectWebSocketConnection(connectionId);
    
    console.log('WebSocket connection marked as disconnected:', connectionId);
    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Failed to update WebSocket connection:', error);
    return { statusCode: 500, body: 'Disconnection failed' };
  }
};

export const default = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || '{}');
  
  console.log('WebSocket message received:', { connectionId, body });
  
  try {
    // Update last seen timestamp
    await dbClient.updateWebSocketLastSeen(connectionId);
    
    // Handle different message types
    switch (body.action) {
      case 'ping':
        const apiGateway = getApiGatewayClient();
        await apiGateway.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          })
        }));
        break;
        
      case 'subscribe':
        // TODO: Handle subscription to specific conversations/channels
        console.log('Subscription request:', body);
        break;
        
      default:
        console.log('Unknown action:', body.action);
    }
    
    return { statusCode: 200, body: 'Message processed' };
  } catch (error) {
    console.error('Failed to process WebSocket message:', error);
    return { statusCode: 500, body: 'Message processing failed' };
  }
};
