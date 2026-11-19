<?php
/**
 * Live PostgreSQL/Supabase integration checks for SaveRepository.
 *
 * Run with: npm run test:pg
 *
 * The test is skipped when gamefile/db.php is missing or points at MySQL.
 * When it runs, it creates a temporary account, saves twice (exercising the
 * INSERT ... ON CONFLICT path), loads the data back, and always cleans up.
 */
$dbFile = __DIR__ . '/../gamefile/db.php';
if (!is_file($dbFile)) {
    echo "skip - gamefile/db.php is not configured\n";
    exit(0);
}

require_once $dbFile;
require_once __DIR__ . '/../gamefile/src/SaveRepository.php';

if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'pgsql') {
    echo "skip - gamefile/db.php is not a PostgreSQL connection\n";
    exit(0);
}

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

$suffix = bin2hex(random_bytes(4));
$username = 'jolli_test_' . $suffix;
$email = 'jolli.test.' . $suffix . '@example.com';
$userId = null;

try {
    $insert = $pdo->prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?) RETURNING id');
    $insert->execute([$username, $email, password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT)]);
    $userId = (int)$insert->fetchColumn();
    check($userId > 0, 'a temporary PostgreSQL user can be created');

    $payload = [
        'version'  => 3,
        'level'    => 6,
        'honey'    => 4321.5,
        'diamonds' => 7,
        'location' => 1,
        'staff'    => 3,
        'stations' => [
            ['unlocked' => true, 'recipe' => 4],
            ['unlocked' => true, 'recipe' => 2],
            ['unlocked' => false, 'recipe' => 0],
            ['unlocked' => false, 'recipe' => 0],
        ],
        'upgrades' => ['tipChance' => 3, 'queue' => 2, 'walkSpeed' => 1, 'cookSpeed' => 1, 'profitX2' => 0],
        'missions' => [
            'index'    => 15,
            'done'     => ['l1_serve5', 'l1_hire2'],
            'finished' => false,
        ],
        'stats' => ['served' => 42, 'earned' => 9000, 'tips' => 9, 'tipHoney' => 77],
        'cosmetics' => [
            'owned'    => ['bee_bow'],
            'equipped' => ['bee' => 'bee_bow', 'theme' => ''],
        ],
    ];

    $clean = SaveRepository::clean($payload);
    check(is_array($clean), 'the v3 payload passes validation');

    $repo = new SaveRepository($pdo);
    $first = $repo->save($userId, $clean);
    check($first['saved'] === true, 'the first save is stored');
    $loaded = $repo->load($userId);

    check($loaded !== null, 'the save can be loaded back');
    check($loaded['version'] === 3, 'the loaded save is version 3');
    check($loaded['level'] === 6 && $loaded['location'] === 1, 'level and location round-trip');
    check(abs($loaded['honey'] - 4321.5) < 1e-9 && $loaded['diamonds'] === 7, 'currencies round-trip');
    check($loaded['staff'] === 3, 'global staff round-trips');
    check($loaded['stations'][0] === ['unlocked' => true, 'recipe' => 4], 'station progress round-trips');
    check($loaded['upgrades']['cookSpeed'] === 1 && $loaded['upgrades']['profitX2'] === 0, 'global upgrades round-trip');
    check($loaded['missions']['done'] === ['l1_serve5', 'l1_hire2'], 'mission state round-trips');
    check($loaded['cosmetics']['equipped']['bee'] === 'bee_bow', 'equipped cosmetic round-trips');

    $clean['honey'] = 9999.5;
    $clean['diamonds'] = 12;
    $clean['level'] = 7;
    $clean['staff'] = 5;
    $clean['stations'][0]['recipe'] = 10;
    $clean['stations'][1]['unlocked'] = true;
    $clean['stations'][1]['recipe'] = 2;
    $clean['upgrades']['cookSpeed'] = 5;
    $clean['upgrades']['profitX2'] = 1;
    $clean['missions']['index'] = 18;
    $clean['missions']['finished'] = true;
    $clean['cosmetics']['owned'][] = 'bee_shades';
    $clean['seq'] = 20;

    $second = $repo->save($userId, $clean);
    check($second['saved'] === true, 'the newer save is stored');
    $updated = $repo->load($userId);

    check($updated['level'] === 7 && abs($updated['honey'] - 9999.5) < 1e-9, 'the ON CONFLICT update path works');
    check($updated['staff'] === 5, 'global staff updates');
    check($updated['stations'][0]['recipe'] === 10, 'recipe progress updates');
    check($updated['upgrades']['cookSpeed'] === 5 && $updated['upgrades']['profitX2'] === 1, 'late-game global upgrades update');
    check($updated['missions']['finished'] === false, 'the finished flag follows the mission index');
    check(count($updated['cosmetics']['owned']) === 2, 'new cosmetics are appended');
    check($updated['seq'] === 20, 'the write number round-trips');

    // A slow request that arrives late must not undo the newer progress.
    $stale = $clean;
    $stale['honey'] = 1.0;
    $stale['seq'] = 5;
    $staleResult = $repo->save($userId, $stale);
    check($staleResult['saved'] === false, 'an older save is rejected');
    check($staleResult['seq'] === 20, 'the rejected save reports the stored write number');
    $afterStale = $repo->load($userId);
    check(abs($afterStale['honey'] - 9999.5) < 1e-9, 'the newer progress is still stored');
} catch (Throwable $e) {
    $failures++;
    echo 'FAIL - ' . $e->getMessage() . "\n";
} finally {
    if ($userId === null) {
        $find = $pdo->prepare('SELECT id FROM users WHERE username = ?');
        $find->execute([$username]);
        $found = $find->fetchColumn();
        if ($found) {
            $userId = (int)$found;
        }
    }
    if ($userId !== null) {
        $pdo->prepare('DELETE FROM player_stations WHERE user_id = ?')->execute([$userId]);
        $pdo->prepare('DELETE FROM player_progress WHERE user_id = ?')->execute([$userId]);
        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
    }
}

if ($failures > 0) {
    echo "\n{$failures} PostgreSQL check(s) failed\n";
    exit(1);
}
echo "\nAll PostgreSQL SaveRepository checks passed\n";
