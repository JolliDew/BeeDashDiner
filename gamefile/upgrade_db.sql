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

-- Existing saves were location-based. Give them the matching starting tier so
-- they do not replay the first restaurants. New players stay at level 1.
UPDATE player_progress
SET level = CASE location_no WHEN 2 THEN 5 WHEN 3 THEN 8 ELSE 1 END
WHERE level = 1 AND location_no > 1;
