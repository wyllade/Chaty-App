-- Add push notification token to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for push_token lookups
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token);
