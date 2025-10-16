# Omnichannel Backend Service Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    External Platforms                          │
├─────────────────────────────────────────────────────────────────┤
│  WhatsApp    │  Facebook   │  Instagram   │  Telegram          │
│  Business    │  Messenger  │  Graph API   │  Bot API           │
└──────────────┼─────────────┼─────────────┼────────────────────┘
               │             │             │
               ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Webhook Service                             │
│  • Receive webhooks from all platforms                        │
│  • Validate signatures                                        │
│  • Parse platform-specific formats                            │
│  • Store messages in Aurora PostgreSQL                        │
│  • Queue messages for processing                              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Aurora PostgreSQL                           │
│  • messages table - all incoming/outgoing messages            │
│  • webhook_logs table - audit trail                           │
│  • queue_logs table - processing status                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SQS Queue                                   │
│  • Decouple webhook processing from message processing         │
│  • Handle message ordering and retry logic                     │
│  • Dead letter queue for failed messages                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Message Processor                           │
│  • Process queued messages                                     │
│  • Normalize message formats                                   │
│  • Route messages to appropriate UI endpoints                  │
│  • Update processing status                                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Applications                        │
│  • Agent Dashboard                                             │
│  • User Interface                                              │
│  • Real-time notifications                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Service Components

### 1. Infrastructure Service
- **Aurora PostgreSQL Cluster** (Serverless v2)
  - messages table
  - webhook_logs table
  - queue_logs table
- **SQS Queue** (with DLQ)
- **API Gateway** (for webhooks)
- **VPC & Security Groups**

### 2. Webhook Service
- **Lambda Function**: `webhookHandler`
- **Endpoints**: 
  - `GET /webhook/{platform}` - Webhook verification
  - `POST /webhook/{platform}` - Message webhooks
- **Dependencies**: Aurora PostgreSQL, SQS Queue
- **Platforms**: WhatsApp, Facebook, Instagram, Telegram

### 3. Message Processor Service
- **Lambda Function**: `messageProcessor`
- **Trigger**: SQS Queue events
- **Dependencies**: Aurora PostgreSQL
- **Processing**: Message normalization, UI routing

## Data Flow

1. **Webhook Reception**
   ```
   Platform → Webhook Service → Validation → Database Storage → Queue
   ```

2. **Message Processing**
   ```
   Queue → Message Processor → Normalization → UI Routing → Status Update
   ```

3. **Error Handling**
   ```
   Failed Messages → Dead Letter Queue → Retry Logic → Error Logging
   ```

## Technology Stack

- **Runtime**: Node.js 18.x with TypeScript
- **Framework**: Serverless Framework with Compose
- **Database**: Aurora PostgreSQL Serverless v2
- **Queue**: Amazon SQS with DLQ
- **Compute**: AWS Lambda
- **API**: Amazon API Gateway
- **Build**: Webpack with ts-loader
- **Deployment**: Serverless Compose

## Environment Variables

- `AURORA_CLUSTER_ARN` - Aurora cluster ARN
- `AURORA_SECRET_ARN` - Database credentials
- `MESSAGE_QUEUE_URL` - SQS queue URL
- `VPC_ID` - VPC for Lambda functions
- `SUBNET_1_ID`, `SUBNET_2_ID` - Subnets for Aurora
- Platform API tokens and webhook secrets
