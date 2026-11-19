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
            'recipe'   => 0,
        ];
    }
    return $out;
}

// A complete v3 payload is preserved.
$raw = [
    'version'  => 3,
    'level'    => 6,
    'honey'    => 123.5,
    'diamonds' => 7,
    'location' => 1,
    'staff'    => 3,
    'stations' => stations(4),
    'upgrades' => ['tipChance' => 3, 'queue' => 2, 'walkSpeed' => 1, 'cookSpeed' => 2, 'profitX2' => 1],
    'missions' => [
        'index'    => 15,
        'done'     => ['l1_serve5', 'l1_hire2', 'l1_serve5'],
        'finished' => false,
    ],
    'stats'    => ['served' => 42, 'earned' => 9000, 'tips' => 9, 'tipHoney' => 77],
    'cosmetics' => [
        'owned'    => ['bee_bow', 'bee_bow', 'bad id!', 7],
        'equipped' => ['bee' => 'bee_bow', 'theme' => 'bad theme!'],
    ],
];
$raw['stations'][0]['recipe'] = 4;
$raw['stations'][1]['unlocked'] = true;
$raw['stations'][1]['recipe'] = 2;

$clean = SaveRepository::clean($raw);
check(is_array($clean), 'a complete v3 payload is accepted');
check($clean['version'] === 3, 'the clean save is version 3');
check($clean['level'] === 6 && $clean['location'] === 1, 'level and location are preserved');
check(abs($clean['honey'] - 123.5) < 1e-9 && $clean['diamonds'] === 7, 'currencies are preserved');
check($clean['staff'] === 3, 'global staff is preserved');
check($clean['upgrades'] === ['tipChance' => 3, 'queue' => 2, 'walkSpeed' => 1, 'cookSpeed' => 2, 'profitX2' => 1], 'global upgrades are preserved');
check($clean['stations'][0] === ['unlocked' => true, 'recipe' => 4], 'stations keep only unlocked and recipe');
check($clean['missions']['index'] === 15, 'mission index is preserved');
check($clean['missions']['done'] === ['l1_serve5', 'l1_hire2'], 'valid mission ids are deduplicated and capped to the index');
check($clean['stats']['served'] === 42 && $clean['stats']['tips'] === 9, 'stats are preserved');
check($clean['cosmetics']['owned'] === ['bee_bow'], 'cosmetic ids are validated and deduplicated');
check($clean['cosmetics']['equipped']['bee'] === 'bee_bow', 'equipped bee cosmetic is preserved');
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
check($migrated['diamonds'] === 0 && $migrated['missions']['index'] === 21, 'new fields get defaults');
check($migrated['staff'] === 1, 'a missing staff value becomes one bee');

// v2 per-station staff and late-game upgrades migrate to the global model.
$legacy = [
    'version'  => 2,
    'level'    => 6,
    'location' => 1,
    'honey'    => 50,
    'stations' => [
        ['unlocked' => true, 'staff' => 2, 'recipe' => 6, 'workLvl' => 2, 'profitX2' => 1],
        ['unlocked' => true, 'staff' => 1, 'recipe' => 2, 'workLvl' => 4, 'profitX2' => 0],
        ['unlocked' => false, 'staff' => 0, 'recipe' => 0],
        ['unlocked' => false, 'staff' => 0, 'recipe' => 0],
    ],
    'upgrades' => ['tipChance' => 2, 'queue' => 1, 'walkSpeed' => 1, 'workerSlot' => 1],
];
$legacyClean = SaveRepository::clean($legacy);
check($legacyClean['staff'] === 3, 'legacy station staff is summed into global staff');
check($legacyClean['upgrades']['cookSpeed'] === 4, 'legacy work level becomes cookSpeed');
check($legacyClean['upgrades']['profitX2'] === 1, 'legacy station profit becomes global profitX2');
check(!isset($legacyClean['upgrades']['workerSlot']), 'the removed workerSlot upgrade is dropped');
check($legacyClean['stations'][0] === ['unlocked' => true, 'recipe' => 6], 'legacy station fields are not returned');

// Values outside the allowed ranges are clamped.
$wild = $raw;
$wild['level'] = 99;
$wild['honey'] = -5;
$wild['diamonds'] = -1;
$wild['staff'] = 99;
$wild['upgrades'] = ['tipChance' => 99, 'queue' => -3, 'walkSpeed' => 9, 'workerSlot' => 4];
$wild['missions']['done'] = ['ok_id', 'ok_id', 'bad id', 123];
$wild['cosmetics']['owned'] = array_map(fn($n) => 'bee' . $n, range(0, 79));
$wild['stations'][1] = ['unlocked' => true, 'recipe' => 99];
$wild['stations'][2] = ['unlocked' => false, 'recipe' => -3];
$wildClean = SaveRepository::clean($wild);
check($wildClean['level'] === 5, 'a level that does not match the location is repaired');
check($wildClean['honey'] === 0.0 && $wildClean['diamonds'] === 0, 'negative currencies are clamped');
check($wildClean['upgrades'] === ['tipChance' => 10, 'queue' => 0, 'walkSpeed' => 5, 'cookSpeed' => 0, 'profitX2' => 0], 'upgrade levels are clamped');
check($wildClean['missions']['done'] === ['ok_id'], 'bad mission ids are removed and the list is capped to the index');
check(count($wildClean['cosmetics']['owned']) === 50, 'owned cosmetics are capped');
check($wildClean['stations'][1] === ['unlocked' => true, 'recipe' => 10], 'station values are clamped');
check($wildClean['stations'][2] === ['unlocked' => false, 'recipe' => 0], 'locked stations lose recipes');
check($wildClean['staff'] === 6, 'staff is clamped to the open worker slots');

// Stations must open in order.
$skip = $raw;
$skip['stations'][1]['unlocked'] = false;
$skip['stations'][2]['unlocked'] = true;
$skip['stations'][2]['recipe'] = 8;
$skipClean = SaveRepository::clean($skip);
check($skipClean['stations'][2]['unlocked'] === false, 'a station cannot skip the previous one');
check($skipClean['stations'][2]['recipe'] === 0, 'a locked station loses its recipe');

// The first station is always open and staffed.
$closed = $raw;
$closed['stations'][0] = ['unlocked' => false, 'recipe' => 2];
$closed['staff'] = 0;
$closedClean = SaveRepository::clean($closed);
check($closedClean['stations'][0]['unlocked'] === true, 'the first station is forced open');
check($closedClean['staff'] === 1, 'the first station gets at least one worker');

// The mission index may only cover the missions of the player's own level.
$crafted = $raw;
$crafted['missions']['index'] = 30;
$crafted['missions']['finished'] = true;
$craftedClean = SaveRepository::clean($crafted);
check($craftedClean['missions']['index'] === 18, 'a crafted mission index is capped at the level boundary');
check($craftedClean['missions']['finished'] === false, 'the finished flag cannot be claimed early');

$finished = $raw;
$finished['level'] = 10;
$finished['location'] = 2;
$finished['stations'] = stations(5);
$finished['missions']['index'] = 30;
$finishedClean = SaveRepository::clean($finished);
check($finishedClean['missions']['index'] === 30, 'the last mission of the last level is allowed');
check($finishedClean['missions']['finished'] === true, 'the finished flag follows the mission index');

// The write number tells the server which save is newer.
check($clean['seq'] === 0, 'a save without a write number gets zero');
$numbered = $raw;
$numbered['seq'] = 42;
check(SaveRepository::clean($numbered)['seq'] === 42, 'the write number is preserved');
$negative = $raw;
$negative['seq'] = -5;
check(SaveRepository::clean($negative)['seq'] === 0, 'a negative write number is clamped');

// Milestone slots match the client.
check(SaveRepository::slotsForRecipe(0) === 1, 'recipe 0 opens one slot');
check(SaveRepository::slotsForRecipe(2) === 2, 'recipe 2 opens a second slot');
check(SaveRepository::slotsForRecipe(6) === 3, 'recipe 6 opens a third slot');
check(SaveRepository::slotsForRecipe(10) === 4, 'recipe 10 opens a fourth slot');

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
