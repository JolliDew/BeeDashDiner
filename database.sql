-- Complete PostgreSQL / Supabase schema for BeeDashDiner, including the
-- two demo accounts used for grading.
-- Run in the Supabase SQL Editor, or:
--   psql "$DATABASE_URL" -f database.sql
--
-- gamefile/login_db_pg.sql is the same schema without the demo accounts.
--
-- Safe to re-run: tables use IF NOT EXISTS, missing columns are added with
-- ALTER TABLE ... IF NOT EXISTS, and seed rows use ON CONFLICT.
SET client_encoding = 'UTF8';
BEGIN;

-- Accounts (login.php, register.php, google-login.php, admin.php).
-- Supabase projects normally already have this table; IF NOT EXISTS keeps it.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'player',
  avatar VARCHAR(255) NULL,
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
  password_set SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Existing databases created before the admin panel need this column.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'player';
-- Profile picture uploaded by the player (path relative to gamefile/).
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) NULL;
-- Google-created accounts start with a random hidden password (password_set = 0).
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_set SMALLINT NOT NULL DEFAULT 1;

-- Admin action history. Usernames are snapshotted so the log survives a
-- deleted account.
CREATE TABLE IF NOT EXISTS admin_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id INTEGER NULL,
  actor_username VARCHAR(50) NULL,
  action VARCHAR(40) NOT NULL,
  target_user_id INTEGER NULL,
  target_username VARCHAR(50) NULL,
  details VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit (target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit (created_at);

-- One row per account: honey, tier, currencies and saved gameplay blobs.
-- location_no: 1 Meadow Stand, 2 Hive Café, 3 Royal Hive.
-- level: 1..10 (see gamefile/js/config.js LEVELS).
-- upgrades / missions_done / stats / cosmetics are JSON text.
-- The current staff count is stored as upgrades.staff (one global hive team).
CREATE TABLE IF NOT EXISTS player_progress (
  user_id INTEGER NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  honey DOUBLE PRECISION NOT NULL DEFAULT 50,
  location_no SMALLINT NOT NULL DEFAULT 1,
  level SMALLINT NOT NULL DEFAULT 1,
  diamonds INTEGER NOT NULL DEFAULT 0,
  upgrades TEXT NULL,
  mission_index INTEGER NOT NULL DEFAULT 0,
  missions_done TEXT NULL,
  missions_finished SMALLINT NOT NULL DEFAULT 0,
  stats TEXT NULL,
  cosmetics TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add late-game columns to an older PostgreSQL install.
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS honey DOUBLE PRECISION NOT NULL DEFAULT 50;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS location_no SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS level SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS diamonds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS upgrades TEXT NULL;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS mission_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS missions_done TEXT NULL;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS missions_finished SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS stats TEXT NULL;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS cosmetics TEXT NULL;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Station progress for the current location.
-- Save v3 keeps only unlocked + recipe_lvl here. staff, work_lvl and
-- profit_x2 are legacy columns kept so old rows still load; new saves write 0.
-- recipe_lvl max 10: milestones at 2/6/10 add a slot, 4/8 double profit.
CREATE TABLE IF NOT EXISTS player_stations (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL,
  unlocked SMALLINT NOT NULL DEFAULT 0,
  staff SMALLINT NOT NULL DEFAULT 0,
  recipe_lvl SMALLINT NOT NULL DEFAULT 0,
  work_lvl SMALLINT NOT NULL DEFAULT 0,
  profit_x2 SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, slot)
);

ALTER TABLE player_stations ADD COLUMN IF NOT EXISTS unlocked SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE player_stations ADD COLUMN IF NOT EXISTS staff SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE player_stations ADD COLUMN IF NOT EXISTS recipe_lvl SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE player_stations ADD COLUMN IF NOT EXISTS work_lvl SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE player_stations ADD COLUMN IF NOT EXISTS profit_x2 SMALLINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_player_progress_updated ON player_progress (updated_at);

-- Reference data (mirrors js/config.js).
CREATE TABLE IF NOT EXISTS locations (
  location_no SMALLINT PRIMARY KEY,
  name VARCHAR(40),
  cost_multiplier INTEGER,
  seats SMALLINT,
  next_cost DOUBLE PRECISION NULL
);

-- seats is the base queue capacity. The Bigger waiting area upgrade adds one
-- chair per level; gamefile/js/config.js remains the gameplay authority.
INSERT INTO locations (location_no, name, cost_multiplier, seats, next_cost) VALUES
  (1, 'Meadow Stand', 1, 4, 6500),
  (2, 'Hive Café', 6, 4, 48000),
  (3, 'Royal Hive', 36, 4, NULL)
ON CONFLICT (location_no) DO UPDATE SET
  name = EXCLUDED.name,
  cost_multiplier = EXCLUDED.cost_multiplier,
  seats = EXCLUDED.seats,
  next_cost = EXCLUDED.next_cost;

CREATE TABLE IF NOT EXISTS menu_items (
  location_no SMALLINT NOT NULL REFERENCES locations(location_no),
  slot SMALLINT NOT NULL,
  emoji VARCHAR(8),
  name VARCHAR(30),
  base_price DOUBLE PRECISION,
  cook_secs DOUBLE PRECISION,
  unlock_cost DOUBLE PRECISION,
  PRIMARY KEY (location_no, slot)
);

INSERT INTO menu_items (location_no, slot, emoji, name, base_price, cook_secs, unlock_cost) VALUES
  (1, 0, '🌼', 'Nectar Sip', 4, 2, 0),
  (1, 1, '🍞', 'Honey Toast', 10, 3.5, 80),
  (1, 2, '🥣', 'Pollen Soup', 26, 5, 350),
  (2, 0, '🍵', 'Honey Tea', 20, 2, 0),
  (2, 1, '🥞', 'Pancakes', 50, 3.5, 480),
  (2, 2, '🧁', 'Wax Muffin', 130, 5, 2100),
  (2, 3, '🍯', 'Royal Jelly', 300, 6.5, 7800),
  (3, 0, '🍰', 'Honey Cake', 100, 2, 0),
  (3, 1, '🥧', 'Nectar Pie', 250, 3.5, 2880),
  (3, 2, '🍦', 'Sundae', 650, 5, 12600),
  (3, 3, '🍹', 'Mead Fizz', 1500, 6.5, 46800),
  (3, 4, '👑', 'Queen Feast', 3500, 8, 162000)
ON CONFLICT (location_no, slot) DO UPDATE SET
  emoji = EXCLUDED.emoji,
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  cook_secs = EXCLUDED.cook_secs,
  unlock_cost = EXCLUDED.unlock_cost;

COMMIT;

-- ---------------------------------------------------------------------------
-- Demo accounts for grading (PostgreSQL / Supabase).
-- Player: demo_player / JolliDemo123!
-- Admin:  demo_admin  / JolliDemo123!
-- Change these passwords before exposing the app to the public.
-- ---------------------------------------------------------------------------
INSERT INTO users (username, email, password, role) VALUES
  ('demo_player', 'demo_player@example.test', '$2y$10$kZAvuKAcM/dWd9JaMZKu1eeRzIu4ajCvjPstmsNBFGE2jqZKfApky', 'player'),
  ('demo_admin',  'demo_admin@example.test',  '$2y$10$kZAvuKAcM/dWd9JaMZKu1eeRzIu4ajCvjPstmsNBFGE2jqZKfApky', 'admin')
ON CONFLICT (username) DO NOTHING;
