/*
  # Create Dynamic Links and Click Events Tables

  1. New Tables
    - `dynamic_links`
      - `id` (uuid, primary key)
      - `name` (varchar)
      - `alias` (varchar, unique)
      - `defaultUrl` (varchar)
      - `rules` (jsonb)
      - `utmParameters` (jsonb)
      - `metaTitle` (varchar)
      - `metaDescription` (varchar)
      - `metaImage` (varchar)
      - `isActive` (boolean)
      - `tags` (text array)
      - `userId` (uuid, foreign key)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

    - `dynamic_link_click_events`
      - `id` (uuid, primary key)
      - Various tracking fields
      - `dynamicLinkId` (uuid, foreign key)
      - `timestamp` (timestamp)

    - `click_events`
      - `id` (uuid, primary key)
      - Various tracking fields
      - `linkId` (uuid, foreign key)
      - `timestamp` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create dynamic_links table
CREATE TABLE IF NOT EXISTS dynamic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  alias VARCHAR NOT NULL UNIQUE,
  "defaultUrl" VARCHAR NOT NULL,
  rules JSONB NOT NULL,
  "utmParameters" JSONB,
  "metaTitle" VARCHAR,
  "metaDescription" VARCHAR,
  "metaImage" VARCHAR,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[],
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dynamic_link_click_events table
CREATE TABLE IF NOT EXISTS dynamic_link_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ipAddress" VARCHAR,
  "userAgent" VARCHAR,
  referrer VARCHAR,
  country VARCHAR,
  state VARCHAR,
  city VARCHAR,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  "operatingSystem" VARCHAR,
  "osVersion" VARCHAR,
  "browserName" VARCHAR,
  "browserVersion" VARCHAR,
  "deviceModel" VARCHAR,
  "sessionId" VARCHAR,
  "utmSource" VARCHAR,
  "utmMedium" VARCHAR,
  "utmCampaign" VARCHAR,
  "utmTerm" VARCHAR,
  "utmContent" VARCHAR,
  "dynamicLinkId" UUID REFERENCES dynamic_links(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create click_events table
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ipAddress" VARCHAR,
  "userAgent" VARCHAR,
  referrer VARCHAR,
  country VARCHAR,
  state VARCHAR,
  city VARCHAR,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  "operatingSystem" VARCHAR,
  "osVersion" VARCHAR,
  "browserName" VARCHAR,
  "browserVersion" VARCHAR,
  "deviceModel" VARCHAR,
  "sessionId" VARCHAR,
  "utmSource" VARCHAR,
  "utmMedium" VARCHAR,
  "utmCampaign" VARCHAR,
  "utmTerm" VARCHAR,
  "utmContent" VARCHAR,
  "linkId" UUID REFERENCES links(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE dynamic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_link_click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- Create policies for dynamic_links
CREATE POLICY "Users can read their own dynamic links"
  ON dynamic_links
  FOR SELECT
  TO authenticated
  USING ("userId" = auth.uid());

CREATE POLICY "Users can create their own dynamic links"
  ON dynamic_links
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own dynamic links"
  ON dynamic_links
  FOR UPDATE
  TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can delete their own dynamic links"
  ON dynamic_links
  FOR DELETE
  TO authenticated
  USING ("userId" = auth.uid());

-- Create policies for dynamic_link_click_events
CREATE POLICY "Users can read click events for their dynamic links"
  ON dynamic_link_click_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dynamic_links
      WHERE dynamic_links.id = dynamic_link_click_events."dynamicLinkId"
      AND dynamic_links."userId" = auth.uid()
    )
  );

-- Create policies for click_events
CREATE POLICY "Users can read click events for their links"
  ON click_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM links
      WHERE links.id = click_events."linkId"
      AND links."userId" = auth.uid()
    )
  );