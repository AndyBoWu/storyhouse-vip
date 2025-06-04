-- Story Protocol IP Enhancement Migration
-- This migration adds IP functionality to existing StoryHouse.vip database schema
-- Run this migration to enable IP features while maintaining backward compatibility

-- Add IP functionality to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ip_asset_id VARCHAR(255) NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ip_asset_address VARCHAR(42) NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS nft_token_id VARCHAR(255) NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ip_registration_status VARCHAR(20) DEFAULT 'none' CHECK (ip_registration_status IN ('none', 'pending', 'registered', 'failed'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ip_registration_tx_hash VARCHAR(66) NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ip_registration_error TEXT NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS license_status VARCHAR(20) DEFAULT 'none' CHECK (license_status IN ('none', 'attached', 'available'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS parent_ip_asset_id VARCHAR(255) NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS royalty_earnings DECIMAL(20,18) DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS has_claimable_royalties BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ip_metadata JSONB NULL;

-- Add IP functionality to chapters table
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS ip_asset_id VARCHAR(255) NULL;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS ip_asset_address VARCHAR(42) NULL;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS nft_token_id VARCHAR(255) NULL;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS ip_registration_status VARCHAR(20) DEFAULT 'none' CHECK (ip_registration_status IN ('none', 'pending', 'registered', 'failed'));
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS is_part_of_story_ip BOOLEAN DEFAULT TRUE;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS unique_readers INTEGER DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS total_reading_time_seconds INTEGER DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS ip_reads_count INTEGER DEFAULT 0;

-- Add IP functionality to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_assets_created INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_assets_owned INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS licenses_owned INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS royalties_earned DECIMAL(20,18) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS collections_joined JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS collections_created JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_preferences JSONB NULL;

-- Create story_license_terms table
CREATE TABLE IF NOT EXISTS story_license_terms (
  id VARCHAR(255) PRIMARY KEY,
  story_id VARCHAR(255) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  license_terms_id VARCHAR(255) NOT NULL,
  tier_name VARCHAR(20) NOT NULL CHECK (tier_name IN ('standard', 'premium', 'exclusive', 'custom')),
  price DECIMAL(30,18) NOT NULL,
  royalty_percentage INTEGER NOT NULL CHECK (royalty_percentage >= 0 AND royalty_percentage <= 100),
  commercial_use BOOLEAN DEFAULT TRUE,
  derivatives_allowed BOOLEAN DEFAULT TRUE,
  attribution BOOLEAN DEFAULT TRUE,
  share_alike BOOLEAN DEFAULT FALSE,
  exclusivity BOOLEAN DEFAULT FALSE,
  territories JSONB DEFAULT '[]',
  content_restrictions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create story_collections table
CREATE TABLE IF NOT EXISTS story_collections (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_address VARCHAR(42) NOT NULL,
  group_id VARCHAR(255) NULL,
  group_pool_address VARCHAR(42) NULL,
  reward_pool_address VARCHAR(42) NULL,
  is_public BOOLEAN DEFAULT TRUE,
  allow_contributions BOOLEAN DEFAULT TRUE,
  require_approval BOOLEAN DEFAULT FALSE,
  revenue_share_creator INTEGER DEFAULT 70 CHECK (revenue_share_creator >= 0 AND revenue_share_creator <= 100),
  revenue_share_collection INTEGER DEFAULT 20 CHECK (revenue_share_collection >= 0 AND revenue_share_collection <= 100),
  revenue_share_platform INTEGER DEFAULT 10 CHECK (revenue_share_platform >= 0 AND revenue_share_platform <= 100),
  genre VARCHAR(100) NULL,
  theme VARCHAR(255) NULL,
  tags JSONB DEFAULT '[]',
  cover_image VARCHAR(255) NULL,
  total_earnings DECIMAL(20,18) DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  story_count INTEGER DEFAULT 0,
  total_reads INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create collection_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS collection_members (
  collection_id VARCHAR(255) NOT NULL REFERENCES story_collections(id) ON DELETE CASCADE,
  creator_address VARCHAR(42) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, creator_address)
);

-- Create collection_stories table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS collection_stories (
  collection_id VARCHAR(255) NOT NULL REFERENCES story_collections(id) ON DELETE CASCADE,
  story_id VARCHAR(255) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  ip_asset_id VARCHAR(255) NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, story_id)
);

-- Create ip_operations table for tracking blockchain operations
CREATE TABLE IF NOT EXISTS ip_operations (
  id VARCHAR(255) PRIMARY KEY,
  story_id VARCHAR(255) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('register', 'license', 'derivative', 'royalty', 'collection')),
  transaction_hash VARCHAR(66) NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  can_retry BOOLEAN DEFAULT FALSE,
  estimated_gas DECIMAL(30,0) NULL,
  ip_asset_id VARCHAR(255) NULL,
  license_token_id VARCHAR(255) NULL,
  parent_ip_asset_id VARCHAR(255) NULL,
  royalty_amount DECIMAL(20,18) NULL,
  collection_id VARCHAR(255) NULL,
  story_title VARCHAR(255) NULL,
  recipient_name VARCHAR(255) NULL,
  collection_name VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create enhanced_reading_sessions table
CREATE TABLE IF NOT EXISTS enhanced_reading_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  story_id VARCHAR(255) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id VARCHAR(255) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  total_reading_time_seconds INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  rewards_claimed BOOLEAN DEFAULT FALSE,
  reward_amount DECIMAL(20,18) DEFAULT 0,
  base_reward DECIMAL(20,18) DEFAULT 0,
  streak_bonus DECIMAL(20,18) DEFAULT 0,
  quality_bonus DECIMAL(20,18) DEFAULT 0,
  ip_asset_id VARCHAR(255) NULL,
  tracked_via_ip BOOLEAN DEFAULT FALSE,
  min_read_time_reached BOOLEAN DEFAULT FALSE,
  valid_session BOOLEAN DEFAULT TRUE,
  session_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_completed_at TIMESTAMP NULL
);

-- Create story_analytics table
CREATE TABLE IF NOT EXISTS story_analytics (
  story_id VARCHAR(255) PRIMARY KEY REFERENCES stories(id) ON DELETE CASCADE,
  total_reads INTEGER DEFAULT 0,
  unique_readers INTEGER DEFAULT 0,
  average_reading_time_seconds INTEGER DEFAULT 0,
  completion_rate INTEGER DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  total_rewards DECIMAL(20,18) DEFAULT 0,
  reader_rewards DECIMAL(20,18) DEFAULT 0,
  creator_rewards DECIMAL(20,18) DEFAULT 0,
  remix_royalties DECIMAL(20,18) DEFAULT 0,
  ip_asset_views INTEGER DEFAULT 0,
  license_views INTEGER DEFAULT 0,
  derivative_count INTEGER DEFAULT 0,
  royalty_revenue DECIMAL(20,18) DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  daily_reads JSONB DEFAULT '{}',
  weekly_trends JSONB DEFAULT '[]',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create enhanced_remix_licenses table
CREATE TABLE IF NOT EXISTS enhanced_remix_licenses (
  id VARCHAR(255) PRIMARY KEY,
  -- Original system data
  original_story_id VARCHAR(255) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  original_creator_address VARCHAR(42) NOT NULL,
  remix_story_id VARCHAR(255) NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  remixer_address VARCHAR(42) NOT NULL,
  fee_percentage INTEGER NOT NULL CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
  total_fee_paid DECIMAL(20,18) DEFAULT 0,
  transaction_hash VARCHAR(66) NULL,
  -- IP system data
  parent_ip_asset_id VARCHAR(255) NULL,
  child_ip_asset_id VARCHAR(255) NULL,
  license_token_id VARCHAR(255) NULL,
  license_terms_id VARCHAR(255) NULL,
  story_protocol_tx_hash VARCHAR(66) NULL,
  license_tier VARCHAR(20) NULL CHECK (license_tier IN ('standard', 'premium', 'exclusive')),
  is_ip_license BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_ip_asset_id ON stories(ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_stories_ip_registration_status ON stories(ip_registration_status);
CREATE INDEX IF NOT EXISTS idx_stories_parent_ip_asset_id ON stories(parent_ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_chapters_ip_asset_id ON chapters(ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_story_license_terms_story_id ON story_license_terms(story_id);
CREATE INDEX IF NOT EXISTS idx_collection_members_creator ON collection_members(creator_address);
CREATE INDEX IF NOT EXISTS idx_collection_stories_story ON collection_stories(story_id);
CREATE INDEX IF NOT EXISTS idx_ip_operations_story_id ON ip_operations(story_id);
CREATE INDEX IF NOT EXISTS idx_ip_operations_status ON ip_operations(status);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON enhanced_reading_sessions(user_address);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_story ON enhanced_reading_sessions(story_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_remix_licenses_original ON enhanced_remix_licenses(original_story_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_remix_licenses_remix ON enhanced_remix_licenses(remix_story_id);

-- Create triggers to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_story_collections_updated_at
  BEFORE UPDATE ON story_collections
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_story_license_terms_updated_at
  BEFORE UPDATE ON story_license_terms
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ip_operations_updated_at
  BEFORE UPDATE ON ip_operations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_story_analytics_updated_at
  BEFORE UPDATE ON story_analytics
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add constraint to ensure revenue shares add up to 100
ALTER TABLE story_collections
ADD CONSTRAINT check_revenue_shares_sum
CHECK (revenue_share_creator + revenue_share_collection + revenue_share_platform = 100);

-- Add some sample license terms data for the default tiers
INSERT INTO story_license_terms (
  id, story_id, license_terms_id, tier_name, price, royalty_percentage,
  commercial_use, derivatives_allowed, attribution, share_alike, exclusivity
) VALUES
  ('default-standard', 'template', 'standard-terms', 'standard', 100, 5, true, true, true, false, false),
  ('default-premium', 'template', 'premium-terms', 'premium', 500, 10, true, true, true, false, false),
  ('default-exclusive', 'template', 'exclusive-terms', 'exclusive', 2000, 20, true, true, true, false, true)
ON CONFLICT (id) DO NOTHING;

-- Migration complete
-- This migration adds IP functionality while maintaining full backward compatibility
-- Existing stories/chapters/users will have default IP values (none/false/0)
-- New stories can optionally use IP features
