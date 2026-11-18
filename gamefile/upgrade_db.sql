-- Upgrade an existing JolliDew database to the gameplay-expansion schema.
--
-- Run this once in phpMyAdmin (Import tab) or:
--   mysql -uroot jollidew_db < gamefile/upgrade_db.sql
--
-- This is only for databases created before the 10-level update.
-- Fresh installs should import login_db.sql instead.
--
-- XAMPP ships MariaDB, which supports ADD COLUMN IF NOT EXISTS.
-- On MySQL 8, remove "IF NOT EXISTS" and run the file once.
USE jollidew_db;

-- Admin panel: role on every account + an append-only action log.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'player';

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

ALTER TABLE player_progress
  ADD COLUMN IF NOT EXISTS level TINYINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS diamonds INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upgrades TEXT NULL,
  ADD COLUMN IF NOT EXISTS mission_index INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missions_done TEXT NULL,
  ADD COLUMN IF NOT EXISTS missions_finished TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats TEXT NULL,
  ADD COLUMN IF NOT EXISTS cosmetics TEXT NULL;

ALTER TABLE player_stations
  ADD COLUMN IF NOT EXISTS work_lvl TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_x2 TINYINT NOT NULL DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_set TINYINT NOT NULL DEFAULT 1;

-- Existing saves were location-based. Give them the matching starting tier so
-- they do not replay the first restaurants. New players stay at level 1.
UPDATE player_progress
SET level = CASE location_no WHEN 2 THEN 5 WHEN 3 THEN 8 ELSE 1 END
WHERE level = 1 AND location_no > 1;

-- Queue capacity is now 4 base chairs plus the Bigger waiting area upgrade.
-- gamefile/js/config.js is the gameplay authority; this keeps the reference
-- table in step with a fresh login_db.sql install.
UPDATE locations SET seats = 4;
