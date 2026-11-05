<?php
/**
 * Dependency-free checks for SaveRepository::clean().
 * Run with: php tests/SaveRepository.test.php
 */
require_once __DIR__ . '/../gamefile/src/SaveRepository.php';

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

function stations(int $count): array
{
    $out = [];
    for ($i = 0; $i < $count; $i++) {
        $out[] = [
            'unlocked' => $i === 0,
            'staff'    => $i === 0 ? 1 : 0,
            'recipe'   => 0,
            'workLvl'  => 0,
            'profitX2' => 0,
        ];
    }
    return $out;
}

// A complete v2 payload is preserved.
$raw = [
    'version'  => 2,
    'level'    => 6,
    'honey'    => 123.5,
    'diamonds' => 7,
    'location' => 1,
    'stations' => stations(4),
    'upgrades' => ['tipChance' => 3, 'queue' => 2, 'walkSpeed' => 1, 'workerSlot' => 1],
    'missions' => [
        'index'    => 15,
        'done'     => ['l1_serve5', 'l1_hire2', 'l1_serve5'],
        'finished' => false,
    ],
    'stats'    => ['served' => 42, 'earned' => 9000, 'tips' => 9, 'tipHoney' => 77],
    'cosmetics' => [
        'owned'    => ['hat_gold', 'hat_gold', 'bad id!', 7],
        'equipped' => ['bee' => 'hat_gold', 'theme' => 'bad theme!'],
    ],
];
$clean = SaveRepository::clean($raw);
check(is_array($clean), 'a complete v2 payload is accepted');
check($clean['level'] === 6 && $clean['location'] === 1, 'level and location are preserved');
check(abs($clean['honey'] - 123.5) < 1e-9 && $clean['diamonds'] === 7, 'currencies are preserved');
check($clean['upgrades'] === ['tipChance' => 3, 'queue' => 2, 'walkSpeed' => 1, 'workerSlot' => 1], 'global upgrades are preserved');
check($clean['missions']['index'] === 15, 'mission index is preserved');
check($clean['missions']['done'] === ['l1_serve5', 'l1_hire2'], 'mission ids are deduplicated and validated');
check($clean['stats']['served'] === 42 && $clean['stats']['tips'] === 9, 'stats are preserved');
check($clean['cosmetics']['owned'] === ['hat_gold'], 'cosmetic ids are validated and deduplicated');
check($clean['cosmetics']['equipped']['bee'] === 'hat_gold', 'equipped bee cosmetic is preserved');
check($clean['cosmetics']['equipped']['theme'] === '', 'invalid equipped theme becomes empty');

// Old location-only payloads get the matching starting tier.
$old = [
    'honey'    => 100,
    'location' => 2,
    'stations' => stations(5),
];
$migrated = SaveRepository::clean($old);
check($migrated !== null, 'a location-only save is accepted');
check($migrated['level'] === 8, 'a Royal Hive v1 save starts at level 8');
check($migrated['diamonds'] === 0 && $migrated['missions']['index'] === 0, 'new fields get defaults');

// Values outside the allowed ranges are clamped.
$wild = $raw;
$wild['level'] = 99;
$wild['honey'] = -5;
$wild['diamonds'] = -1;
$wild['upgrades'] = ['tipChance' => 99, 'queue' => -3, 'walkSpeed' => 9, 'workerSlot' => 4];
$wild['missions']['done'] = ['ok_id', 'ok_id', 'bad id', 123];
$wild['cosmetics']['owned'] = array_map(fn($n) => 'hat' . $n, range(0, 79));
$wild['stations'][1] = ['unlocked' => true, 'staff' => 99, 'recipe' => 99, 'workLvl' => 99, 'profitX2' => 9];
$wild['stations'][2] = ['unlocked' => false, 'staff' => 9, 'recipe' => -3, 'workLvl' => -1, 'profitX2' => -1];
$wildClean = SaveRepository::clean($wild);
check($wildClean['level'] === 5, 'a level that does not match the location is repaired');
check($wildClean['honey'] === 0.0 && $wildClean['diamonds'] === 0, 'negative currencies are clamped');
check($wildClean['upgrades'] === ['tipChance' => 10, 'queue' => 0, 'walkSpeed' => 5, 'workerSlot' => 1], 'upgrade levels are clamped');
check($wildClean['missions']['done'] === ['ok_id'], 'bad mission ids are removed');
check(count($wildClean['cosmetics']['owned']) === 50, 'owned cosmetics are capped');
check($wildClean['stations'][1] === ['unlocked' => true, 'staff' => 4, 'recipe' => 10, 'workLvl' => 5, 'profitX2' => 1], 'station values are clamped');
check($wildClean['stations'][2] === ['unlocked' => false, 'staff' => 0, 'recipe' => 0, 'workLvl' => 0, 'profitX2' => 0], 'locked stations lose staff and negative values');

// The first station is always open and staffed.
$closed = $raw;
$closed['stations'][0] = ['unlocked' => false, 'staff' => 0, 'recipe' => 2];
$closedClean = SaveRepository::clean($closed);
check($closedClean['stations'][0]['unlocked'] === true, 'the first station is forced open');
check($closedClean['stations'][0]['staff'] === 1, 'the first station gets at least one worker');

// Malformed shapes are rejected instead of being half-saved.
check(SaveRepository::clean(null) === null, 'null is rejected');
check(SaveRepository::clean([]) === null, 'an empty array is rejected');
check(SaveRepository::clean(['location' => 0, 'stations' => []]) === null, 'a station-count mismatch is rejected');
check(SaveRepository::clean(['location' => 0, 'stations' => [1, 2, 3]]) === null, 'non-array stations are rejected');

if ($failures > 0) {
    echo "\n{$failures} check(s) failed\n";
    exit(1);
}
echo "\nAll SaveRepository checks passed\n";
