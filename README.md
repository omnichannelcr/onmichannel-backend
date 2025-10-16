# Omnichannel Backend

A serverless omnichannel messaging backend that centralizes messages from WhatsApp, Facebook, Instagram, and Telegram.

## Architecture

```
Webhook → Aurora PostgreSQL → SQS Queue → Message Processor → UI
```

## Services

- **infrastructure**: Aurora PostgreSQL, SQS Queue, API Gateway
- **webhook-service**: Receives webhooks from platforms, stores messages, queues for processing  
- **inbound-message-processor**: Processes queued inbound messages and routes to UI
- **outbound-message-processor**: Handles sending messages to platforms via API

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp env.example .env
   # Edit .env with your AWS and platform credentials
   ```

3. **Deploy infrastructure**
   ```bash
   npm run deploy:infra
   ```

4. **Deploy services**
   ```bash
   npm run deploy
   ```

## Development

```bash
# Run webhook service locally
npm run dev

# Deploy individual services
npm run deploy:webhook
npm run deploy:processor
```

## Environment Variables

See `env.example` for required environment variables including:
- AWS credentials and VPC configuration
- Aurora database credentials
- Platform API tokens (WhatsApp, Facebook, Instagram, Telegram)
- Webhook verification tokens

## Project Structure

```
├── services/
│   ├── infrastructure/          # Aurora DB, SQS, API Gateway
│   │   ├── serverless.yml      # Infrastructure resources
│   │   └── database.sql        # PostgreSQL schema
│   ├── shared/                  # Shared types and utilities
│   │   ├── types.ts            # TypeScript type definitions
│   │   ├── utils.ts            # Utility functions
│   │   ├── database.ts         # Aurora PostgreSQL client
│   │   └── queue.ts            # SQS queue client
│   ├── webhook-service/         # Webhook receiver
│   │   ├── serverless.yml      # Webhook service config
│   │   ├── webpack.config.js   # TypeScript build config
│   │   └── handler.ts          # Webhook handler (TODO: implement)
│   ├── inbound-message-processor/ # Inbound message processor
│   │   ├── serverless.yml      # Inbound processor config
│   │   ├── webpack.config.js   # TypeScript build config
│   │   └── handler.ts          # Inbound processor (TODO: implement)
│   └── outbound-message-processor/ # Outbound message processor
│       ├── serverless.yml      # Outbound processor config
│       ├── webpack.config.js   # TypeScript build config
│       └── handler.ts          # Outbound processor (TODO: implement)
├── serverless-compose.yml       # Service orchestration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Root dependencies
└── env.example                 # Environment variables template
```
