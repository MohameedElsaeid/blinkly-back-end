/*
  # Add Missing Tables for Complete Platform Functionality

  1. New Tables
    - `qr_codes`
      - QR code generation and tracking
      - Links to users and shortened links
      - Customization options storage
    
    - `webhook_endpoints`
      - Webhook configuration storage
      - Event type tracking
      - Security and delivery tracking

    - `plans`
      - Subscription plan definitions
      - Pricing tiers and features
      - Billing frequency options

    - `user_subscriptions`
      - User subscription tracking
      - Plan association
      - Payment and status tracking

  2. Security
    - Enable RLS on all tables
    - Add appropriate access policies
*/

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  "billingFrequency" VARCHAR(20) NOT NULL,
  price INTEGER,
  description VARCHAR(255),
  features TEXT,
  "shortenedLinksLimit" INTEGER,
  "qrCodesLimit" INTEGER,
  "freeTrialAvailable" BOOLEAN DEFAULT false,
  "freeTrialDays" INTEGER,
  "isMostPopular" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "planId" UUID REFERENCES plans(id),
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL,
  "stripeSubscriptionId" VARCHAR(255),
  "stripeCustomerId" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create qr_codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "targetUrl" VARCHAR NOT NULL,
  "linkId" UUID REFERENCES links(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  size INTEGER DEFAULT 300,
  color VARCHAR(7) DEFAULT '#000000',
  "backgroundColor" VARCHAR(7) DEFAULT '#FFFFFF',
  "logoUrl" VARCHAR,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create webhook_endpoints table
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url VARCHAR NOT NULL,
  events TEXT[] NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  secret VARCHAR(255) UNIQUE NOT NULL,
  "failedAttempts" INTEGER DEFAULT 0,
  "lastFailedAt" TIMESTAMP WITH TIME ZONE,
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- Create policies for plans
CREATE POLICY "Anyone can read plans"
  ON plans
  FOR SELECT
  TO public
  USING (true);

-- Create policies for user_subscriptions
CREATE POLICY "Users can read their own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid());

-- Create policies for qr_codes
CREATE POLICY "Users can read their own QR codes"
  ON qr_codes
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid());

CREATE POLICY "Users can create their own QR codes"
  ON qr_codes
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own QR codes"
  ON qr_codes
  FOR UPDATE
  TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can delete their own QR codes"
  ON qr_codes
  FOR DELETE
  TO authenticated
  USING ("userId" = auth.uid());

-- Create policies for webhook_endpoints
CREATE POLICY "Users can read their own webhook endpoints"
  ON webhook_endpoints
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid());

CREATE POLICY "Users can create their own webhook endpoints"
  ON webhook_endpoints
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own webhook endpoints"
  ON webhook_endpoints
  FOR UPDATE
  TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can delete their own webhook endpoints"
  ON webhook_endpoints
  FOR DELETE
  TO authenticated
  USING ("userId" = auth.uid());

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions("planId");
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes("userId");
CREATE INDEX IF NOT EXISTS idx_qr_codes_link_id ON qr_codes("linkId");
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user_id ON webhook_endpoints("userId");