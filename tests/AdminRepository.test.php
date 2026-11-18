<?php
/**
 * Dependency-free checks for AdminRepository using an in-memory SQLite DB.
 * Run with: php tests/AdminRepository.test.php
 */
require_once __DIR__ . '/../gamefile/src/AdminRepository.php';

$failures = 0;
function check(bool $condition, string $message): void
{
    global $failures;
    if ($condition) {
        echo "ok - {$message}\n";
    } else {
        $failures++;
        echo "FAIL - {$message}\n";
    }
}

function throws(callable $fn, string $message): void
{
    try {
        $fn();
        check(false, $message);
    } catch (InvalidArgumentException $e) {
        check(true, $message);
    } catch (Throwable $e) {
        check(false, $message . ' (' . get_class($e) . ': ' . $e->getMessage() . ')');
    }
}

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->exec('CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT "player",
    avatar TEXT,
    auth_provider TEXT NOT NULL DEFAULT "local",
    password_set INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)');
$pdo->exec('CREATE TABLE player_progress (
    user_id INTEGER PRIMARY KEY,
    honey REAL DEFAULT 50,
    location_no INTEGER DEFAULT 1,
    level INTEGER DEFAULT 1,
    diamonds INTEGER DEFAULT 0,
    upgrades TEXT,
    mission_index INTEGER DEFAULT 0,
    missions_done TEXT,
    missions_finished INTEGER DEFAULT 0,
    stats TEXT,
    cosmetics TEXT,
    updated_at TEXT
)');
$pdo->exec('CREATE TABLE player_stations (
    user_id INTEGER NOT NULL,
    slot INTEGER NOT NULL,
    unlocked INTEGER DEFAULT 0,
    staff INTEGER DEFAULT 0,
    recipe_lvl INTEGER DEFAULT 0,
    work_lvl INTEGER DEFAULT 0,
    profit_x2 INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, slot)
)');
$pdo->exec('CREATE TABLE admin_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    actor_username TEXT,
    action TEXT NOT NULL,
    target_user_id INTEGER,
    target_username TEXT,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)');

$repo = new AdminRepository($pdo);
$alice = $repo->create('alice', 'Alice@Example.com', 'password123', 'player');
$bob = $repo->create('bob_admin', 'bob@example.com', 'password123', 'admin');

check($alice > 0 && $bob > $alice, 'create returns new ids');
$found = $repo->find($alice);
check($found['username'] === 'alice', 'find returns the account');
check($found['email'] === 'alice@example.com', 'emails are stored lowercase');
check($found['role'] === 'player', 'new accounts default to player');
check($found['level'] === null, 'an account without a save has no progress row');

check($repo->countAdmins() === 1, 'countAdmins sees the admin');
$stats = $repo->stats();
check($stats['users'] === 2 && $stats['admins'] === 1 && $stats['saves'] === 0, 'stats count users, admins and saves');

throws(fn() => $repo->create('alice', 'other@example.com', 'password123'), 'duplicate usernames are rejected');
throws(fn() => $repo->create('other', 'alice@example.com', 'password123'), 'duplicate emails are rejected');
throws(fn() => $repo->create('ab', 'short@example.com', 'password123'), 'too-short usernames are rejected');
throws(fn() => $repo->create('bad name', 'bad@example.com', 'password123'), 'unsafe usernames are rejected');
throws(fn() => $repo->create('validname', 'not-an-email', 'password123'), 'invalid emails are rejected');
throws(fn() => $repo->create('validname', 'valid@example.com', 'short'), 'short passwords are rejected');
throws(fn() => $repo->create('validname', 'valid@example.com', 'password123', 'owner'), 'unknown roles are rejected');

$repo->update($alice, 'alice2', 'alice2@example.com', 'admin');
$updated = $repo->find($alice);
check($updated['username'] === 'alice2' && $updated['role'] === 'admin', 'update changes username and role');
check($repo->countAdmins() === 2, 'the promoted user counts as an admin');

$page = $repo->paginate('alice', 1, 1);
check($page['total'] === 1 && count($page['users']) === 1, 'search matches username');
$page = $repo->paginate('example.com', 1, 1);
check($page['total'] === 2 && count($page['users']) === 1, 'search matches email and paginates');
check($page['perPage'] === 1, 'perPage is respected');
$page = $repo->paginate('', 2, 1);
check($page['total'] === 2 && $page['users'][0]['id'] === $bob, 'the second page contains the second user');

$repo->setPassword($alice, 'newpassword123');
$hash = $pdo->query('SELECT password FROM users WHERE id = ' . (int)$alice)->fetchColumn();
check(password_verify('newpassword123', $hash), 'setPassword stores a verifiable hash');
$pwSet = $pdo->query('SELECT password_set FROM users WHERE id = ' . (int)$alice)->fetchColumn();
check((int)$pwSet === 1, 'setPassword marks the account as password-capable');
throws(fn() => $repo->setPassword($alice, 'short'), 'setPassword enforces the minimum length');

$pdo->exec('INSERT INTO player_progress (user_id, honey, level) VALUES (' . (int)$alice . ', 500, 4)');
$pdo->exec('INSERT INTO player_stations (user_id, slot, unlocked, recipe_lvl) VALUES (' . (int)$alice . ', 0, 1, 3)');
$repo->resetProgress($alice);
check($repo->find($alice)['level'] === null, 'resetProgress deletes the progress row');
$count = (int)$pdo->query('SELECT COUNT(*) FROM player_stations WHERE user_id = ' . (int)$alice)->fetchColumn();
check($count === 0, 'resetProgress deletes station rows');

$repo->audit($bob, 'user.update', $alice, 'Test update');
$audits = $repo->audits(10);
check(count($audits) === 1, 'audit stores one row');
check($audits[0]['actor_username'] === 'bob_admin', 'audit snapshots the actor name');
check($audits[0]['target_username'] === 'alice2', 'audit snapshots the target name');

// Leave one admin so the last-admin guards can be exercised.
$repo->update($alice, 'alice2', 'alice2@example.com', 'player');
check($repo->countAdmins() === 1, 'demoting an admin is allowed while another remains');

throws(fn() => $repo->delete($bob, $bob), 'an admin cannot delete their own account');
throws(fn() => $repo->delete($bob, $alice), 'the last admin cannot be deleted by anyone');
throws(fn() => $repo->update($bob, 'bob_admin', 'bob@example.com', 'player'), 'the last admin cannot be demoted');

$carol = $repo->create('carol', 'carol@example.com', 'password123', 'admin');
$repo->delete($carol, $bob);
check($repo->find($carol) === null, 'a normal delete removes the account');
check($repo->countAdmins() === 1, 'deleting one of two admins is allowed');

$dave = $repo->create('dave', 'dave@example.com', 'password123', 'player');
$repo->delete($dave, $bob);
check($repo->find($dave) === null, 'a player account can be deleted');
check($repo->countAdmins() === 1, 'deleting a player does not change the admin count');

$repo->audit($bob, 'user.delete', $dave, 'Deleted dave', 'dave');
$latest = $repo->audits(1)[0];
check($latest['target_username'] === 'dave', 'audit keeps the target name after the account is gone');

throws(fn() => $repo->update(9999, 'ghost', 'ghost@example.com', 'player'), 'updating a missing user fails cleanly');
throws(fn() => $repo->delete(9999, $bob), 'deleting a missing user fails cleanly');

throws(fn() => AdminRepository::assertUsername('x'), 'assertUsername rejects one character');
throws(fn() => AdminRepository::assertEmail('nope'), 'assertEmail rejects bad input');
throws(fn() => AdminRepository::assertPassword('1234567'), 'assertPassword rejects seven characters');
throws(fn() => AdminRepository::assertRole('root'), 'assertRole rejects unknown roles');

if ($failures > 0) {
    echo "\n{$failures} check(s) failed\n";
    exit(1);
}
echo "\nAll AdminRepository checks passed\n";
