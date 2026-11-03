-- phpMyAdmin: Import tab > choose this file > Go.  Safe to re-run (IF NOT EXISTS).
CREATE DATABASE IF NOT EXISTS jollidew_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jollidew_db;

-- Accounts (used by login.php, register.php, google-login.php). An existing users table is left untouched.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One row per account: honey and which location they are on (1 Meadow Stand, 2 Hive Cafe, 3 Royal Hive)
CREATE TABLE IF NOT EXISTS player_progress (
  user_id INT NOT NULL PRIMARY KEY,
  honey DOUBLE NOT NULL DEFAULT 50,
  location_no TINYINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Station progress for the current location
CREATE TABLE IF NOT EXISTS player_stations (
  user_id INT NOT NULL,
  slot TINYINT NOT NULL,                     -- 0..4
  unlocked BOOLEAN NOT NULL DEFAULT 0,
  staff TINYINT NOT NULL DEFAULT 0,          -- bees, max 3
  recipe_lvl TINYINT NOT NULL DEFAULT 0,     -- max 8
  PRIMARY KEY (user_id, slot)
);
-- Optional (only if users.id is plain INT): 
-- ALTER TABLE player_progress ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE player_stations ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Reference data (mirrors js/config.js)
CREATE TABLE IF NOT EXISTS locations (
  location_no TINYINT PRIMARY KEY, name VARCHAR(40), cost_multiplier INT, seats TINYINT, next_cost DOUBLE NULL
);
INSERT INTO locations VALUES (1,'Meadow Stand',1,15,6500),(2,'Hive Cafe',6,20,48000),(3,'Royal Hive',36,25,NULL)
ON DUPLICATE KEY UPDATE name=VALUES(name);

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
