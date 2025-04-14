/*
  # Create Visitor Tracking Table

  1. New Tables
    - `visitors`
      - `id` (uuid, primary key)
      - `deviceId` (text, nullable)
      - `fingerprint` (text, nullable)
      - `ipAddress` (text, nullable)
      - `userAgent` (text, nullable)
      - `browser` (text, nullable)
      - `browserVersion` (text, nullable)
      - `os` (text, nullable)
      - `osVersion` (text, nullable)
      - `device` (text, nullable)
      - `deviceType` (text, nullable)
      - `country` (text, nullable)
      - `region` (text, nullable)
      - `city` (text, nullable)
      - `latitude` (decimal, nullable)
      - `longitude` (decimal, nullable)
      - `visitCount` (integer)
      - `lastVisit` (timestamp)
      - `userId` (uuid, foreign key)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

  2. Security
    - Enable RLS on `visitors` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deviceId text,
  fingerprint text,
  ipAddress text,
  userAgent text,
  browser text,
  browserVersion text,
  os text,
  osVersion text,
  device text,
  deviceType text,
  country text,
  region text,
  city text,
  latitude decimal(9,6),
  longitude decimal(9,6),
  visitCount integer DEFAULT 1,
  lastVisit timestamp,
  userId uuid REFERENCES users(id) ON DELETE CASCADE,
  createdAt timestamp with time zone DEFAULT now(),
  updatedAt timestamp with time zone DEFAULT now()
);

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own visitors"
  ON visitors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = userId);

CREATE POLICY "Users can insert own visitors"
  ON visitors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update own visitors"
  ON visitors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = userId);