-- Omnichannel Backend Database Schema
-- Aurora PostgreSQL

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Messages table - stores all incoming and outgoing messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(20) NOT NULL,
    platform_message_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255),
    contact_id VARCHAR(255),
    direction VARCHAR(10) NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    content_text TEXT,
    content_json JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_platform ON messages(platform);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Webhook logs table - audit trail for all webhook requests
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(20) NOT NULL,
    event_type VARCHAR(100),
    payload JSONB NOT NULL,
    signature VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    status_code INTEGER,
    processing_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_webhook_logs_platform ON webhook_logs(platform);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Queue processing logs table - track message processing
CREATE TABLE queue_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id),
    queue_message_id VARCHAR(255) NOT NULL,
    processing_status VARCHAR(20) NOT NULL,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_queue_logs_message_id ON queue_logs(message_id);
CREATE INDEX idx_queue_logs_processing_status ON queue_logs(processing_status);

-- Update trigger for messages table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_logs_updated_at 
    BEFORE UPDATE ON queue_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();