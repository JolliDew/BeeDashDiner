-- phpMyAdmin: Import tab > choose this file > Go.  Safe to re-run (IF NOT EXISTS).
CREATE DATABASE IF NOT EXISTS jollidew_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jollidew_db;
-- Make CLI imports (mysql < login_db.sql) use UTF-8 too, not just phpMyAdmin.
SET NAMES utf8mb4;

-- Accounts (used by login.php, register.php, google-login.php, admin.php).
-- role is 'player' or 'admin'; admin.php checks it on every request.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'player',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Existing databases created before the admin panel need this column.
-- MariaDB supports IF NOT EXISTS. On MySQL 8, run this line once without it
-- if the column is missing.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'player';

-- Admin action history. Usernames are snapshotted so the log survives a
-- deleted account.
CREATE TABLE IF NOT EXISTS admin_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT NULL,
  actor_username VARCHAR(50) NULL,
  action VARCHAR(40) NOT NULL,
  target_user_id INT NULL,
  target_username VARCHAR(50) NULL,
  details VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_audit_target (target_user_id),
  INDEX idx_admin_audit_created (created_at)
);

-- One row per account: honey, tier, currencies and saved gameplay blobs.
-- location_no: 1 Meadow Stand, 2 Hive Cafe, 3 Royal Hive.
-- level: 1..10 (see gamefile/js/config.js LEVELS).
-- upgrades / missions_done / stats / cosmetics are JSON text.
-- The current staff count is stored as upgrades.staff (one global hive team).
CREATE TABLE IF NOT EXISTS player_progress (
  user_id INT NOT NULL PRIMARY KEY,
  honey DOUBLE NOT NULL DEFAULT 50,
  location_no TINYINT NOT NULL DEFAULT 1,
  level TINYINT NOT NULL DEFAULT 1,
  diamonds INT NOT NULL DEFAULT 0,
  upgrades TEXT NULL,
  mission_index INT NOT NULL DEFAULT 0,
  missions_done TEXT NULL,
  missions_finished TINYINT NOT NULL DEFAULT 0,
  stats TEXT NULL,
  cosmetics TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_player_progress_updated (updated_at)
);

-- Station progress for the current location.
-- Save v3 keeps only unlocked + recipe_lvl here. staff, work_lvl and
-- profit_x2 are legacy columns kept so old rows still load; new saves write 0.
-- recipe_lvl max 10: milestones at 2/6/10 add a slot, 4/8 double profit.
CREATE TABLE IF NOT EXISTS player_stations (
  user_id INT NOT NULL,
  slot TINYINT NOT NULL,                     -- 0..4
  unlocked BOOLEAN NOT NULL DEFAULT 0,
  staff TINYINT NOT NULL DEFAULT 0,          -- legacy, read for migration
  recipe_lvl TINYINT NOT NULL DEFAULT 0,     -- max 10
  work_lvl TINYINT NOT NULL DEFAULT 0,       -- legacy, migrated to cookSpeed
  profit_x2 TINYINT NOT NULL DEFAULT 0,      -- legacy, migrated to profitX2
  PRIMARY KEY (user_id, slot)
);
-- Optional (only if users.id is plain INT):
-- ALTER TABLE player_progress ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE player_stations ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- admin.php deletes progress rows explicitly, so cascades are not required.

-- Reference data (mirrors js/config.js)
CREATE TABLE IF NOT EXISTS locations (
  location_no TINYINT PRIMARY KEY, name VARCHAR(40), cost_multiplier INT, seats TINYINT, next_cost DOUBLE NULL
);
-- seats is the base queue capacity. The Bigger waiting area upgrade adds one
-- chair per level; gamefile/js/config.js remains the gameplay authority.
INSERT INTO locations VALUES (1,'Meadow Stand',1,4,6500),(2,'Hive Cafe',6,4,48000),(3,'Royal Hive',36,4,NULL)
ON DUPLICATE KEY UPDATE name=VALUES(name), seats=VALUES(seats);

CREATE TABLE IF NOT EXISTS menu_items (
  location_no TINYINT, slot TINYINT, emoji VARCHAR(8), name VARCHAR(30),
  base_price DOUBLE, cook_secs DOUBLE, unlock_cost DOUBLE,
  PRIMARY KEY (location_no, slot), FOREIGN KEY (location_no) REFERENCES locations(location_no)
);
INSERT INTO menu_items VALUES
(1,0,'🌼','Nectar Sip',4,2,0),(1,1,'🍞','Honey Toast',10,3.5,80),(1,2,'🥣','Pollen Soup',26,5,350),
(2,0,'🍵','Honey Tea',20,2,0),(2,1,'🥞','Pancakes',50,3.5,480),(2,2,'🧁','Wax Muffin',130,5,2100),(2,3,'🍯','Royal Jelly',300,6.5,7800),
(3,0,'🍰','Honey Cake',100,2,0),(3,1,'🥧','Nectar Pie',250,3.5,2880),(3,2,'🍦','Sundae',650,5,12600),(3,3,'🍹','Mead Fizz',1500,6.5,46800),(3,4,'👑','Queen Feast',3500,8,162000)
ON DUPLICATE KEY UPDATE name=VALUES(name);
