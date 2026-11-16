<?php
/** Reads and writes one player's progress. Uses the PDO connection from db.php. */
class SaveRepository
{
    private const STATIONS_PER_LOCATION = [3, 4, 5];
    private const LEVELS_PER_LOCATION = [1, 5, 8];
    private const MAX_LEVEL = 10;
    private const MAX_RECIPE = 10;
    private const MAX_WORK = 5;       // legacy per-station column, read only
    private const MAX_DIAMONDS = 1000000000;
    private const MAX_HONEY = 1.0e15;
    private const MAX_STAFF = 20;
    private const GLOBAL_MAX = [
        'tipChance' => 10,
        'queue' => 10,
        'walkSpeed' => 5,
        'cookSpeed' => 5,
        'profitX2' => 1,
    ];

    public function __construct(private PDO $pdo) {}

    public function load(int $userId): ?array
    {
        $q = $this->pdo->prepare('SELECT * FROM player_progress WHERE user_id = ?');
        $q->execute([$userId]);
        $p = $q->fetch();
        if (!$p) {
            return null;
        }

        $location = self::clampInt(((int)($p['location_no'] ?? 1)) - 1, 0, count(self::STATIONS_PER_LOCATION) - 1);
        $level = self::clampInt($p['level'] ?? 1, 1, self::MAX_LEVEL);

        // Rows created before the level column existed get their tier from the
        // restaurant they had reached. Never throw away their station progress.
        if ($level <= 1 && $location > 0) {
            $level = self::LEVELS_PER_LOCATION[$location] ?? 1;
        }
        if (self::locationForLevel($level) !== $location) {
            $level = self::LEVELS_PER_LOCATION[$location] ?? 1;
        }

        $q = $this->pdo->prepare(
            'SELECT unlocked, staff, recipe_lvl, work_lvl, profit_x2
             FROM player_stations WHERE user_id = ? ORDER BY slot'
        );
        $q->execute([$userId]);
        $rows = $q->fetchAll();

        // Legacy rows stored a worker count on every station. Sum it so a v2
        // save keeps its bees after the global-staff migration.
        $legacyStaff = 0;
        $legacyCook = 0;
        $legacyProfit = 0;
        foreach ($rows as $r) {
            if (!empty($r['unlocked'])) {
                $legacyStaff += self::clampInt($r['staff'] ?? 0, 0, self::MAX_STAFF);
            }
            $legacyCook = max($legacyCook, self::clampInt($r['work_lvl'] ?? 0, 0, self::MAX_WORK));
            $legacyProfit = max($legacyProfit, self::clampInt($r['profit_x2'] ?? 0, 0, 1));
        }

        $expected = self::STATIONS_PER_LOCATION[$location];
        $stations = [];
        $previousOpen = true;
        for ($i = 0; $i < $expected; $i++) {
            $row = $rows[$i] ?? [];
            $unlocked = $i === 0 || (!empty($row['unlocked']) && $previousOpen);
            $stations[] = [
                'unlocked' => $unlocked,
                'recipe' => $unlocked
                    ? self::clampInt($row['recipe_lvl'] ?? 0, 0, self::MAX_RECIPE)
                    : 0,
            ];
            $previousOpen = $unlocked;
        }

        // The hive's bee count is stored inside the existing `upgrades` JSON
        // column, so no extra database column is needed.
        $rawUp = $this->decode($p['upgrades'] ?? null, []);
        $staff = $rawUp['staff'] ?? $legacyStaff;
        $staff = self::clampStaff($staff, $stations);

        $index = self::clampInt($p['mission_index'] ?? 0, 0, 1000);
        $done = self::cleanDone($this->decode($p['missions_done'] ?? null, []));

        return [
            'version' => 3,
            'honey' => self::clampFloat($p['honey'] ?? 0, 0, self::MAX_HONEY),
            'location' => $location,
            'level' => $level,
            'diamonds' => self::clampInt($p['diamonds'] ?? 0, 0, self::MAX_DIAMONDS),
            'staff' => $staff,
            'stations' => $stations,
            'upgrades' => self::cleanUpgrades($rawUp, $legacyCook, $legacyProfit),
            'missions' => [
                'index' => $index,
                'done' => array_slice($done, 0, $index),
                'finished' => !empty($p['missions_finished']),
            ],
            'stats' => self::cleanStats($this->decode($p['stats'] ?? null, [])),
            'cosmetics' => self::cleanCosmetics($this->decode($p['cosmetics'] ?? null, [])),
        ];
    }

    /** Validates and clamps client data. Returns null if the shape is wrong. */
    public static function clean(mixed $d): ?array
    {
        if (!is_array($d) || !isset($d['location'], $d['stations']) || !is_array($d['stations'])) {
            return null;
        }

        $loc = self::clampInt($d['location'], 0, count(self::STATIONS_PER_LOCATION) - 1);
        if (!isset(self::STATIONS_PER_LOCATION[$loc]) || count($d['stations']) !== self::STATIONS_PER_LOCATION[$loc]) {
            return null;
        }

        $level = self::clampInt($d['level'] ?? (self::LEVELS_PER_LOCATION[$loc] ?? 1), 1, self::MAX_LEVEL);
        if (self::locationForLevel($level) !== $loc) {
            $level = self::LEVELS_PER_LOCATION[$loc] ?? 1;
        }

        $stations = [];
        $legacyStaff = 0;
        $legacyCook = 0;
        $legacyProfit = 0;
        $previousOpen = true;
        foreach (array_values($d['stations']) as $idx => $s) {
            if (!is_array($s)) {
                return null;
            }
            // Stations open in order. A save that skips one is normalized so a
            // crafted payload cannot unlock the expensive menu early.
            $unlocked = $idx === 0 || (!empty($s['unlocked']) && $previousOpen);
            $recipe = $unlocked
                ? self::clampInt($s['recipe'] ?? 0, 0, self::MAX_RECIPE)
                : 0;
            $stations[] = [
                'unlocked' => $unlocked,
                'recipe' => $recipe,
            ];
            if ($unlocked) {
                $legacyStaff += self::clampInt($s['staff'] ?? 0, 0, self::MAX_STAFF);
            }
            $legacyCook = max($legacyCook, self::clampInt($s['workLvl'] ?? 0, 0, self::MAX_WORK));
            $legacyProfit = max($legacyProfit, self::clampInt($s['profitX2'] ?? 0, 0, 1));
            $previousOpen = $unlocked;
        }

        $rawStaff = array_key_exists('staff', $d) ? $d['staff'] : $legacyStaff;
        $missions = is_array($d['missions'] ?? null) ? $d['missions'] : [];
        $index = self::clampInt($missions['index'] ?? 0, 0, 1000);
        $done = self::cleanDone($missions['done'] ?? []);

        return [
            'version' => 3,
            'honey' => self::clampFloat($d['honey'] ?? 0, 0, self::MAX_HONEY),
            'location' => $loc,
            'level' => $level,
            'diamonds' => self::clampInt($d['diamonds'] ?? 0, 0, self::MAX_DIAMONDS),
            'staff' => self::clampStaff($rawStaff, $stations),
            'stations' => $stations,
            'upgrades' => self::cleanUpgrades(
                is_array($d['upgrades'] ?? null) ? $d['upgrades'] : [],
                $legacyCook,
                $legacyProfit
            ),
            'missions' => [
                'index' => $index,
                'done' => array_slice($done, 0, $index),
                'finished' => !empty($missions['finished']),
            ],
            'stats' => self::cleanStats(is_array($d['stats'] ?? null) ? $d['stats'] : []),
            'cosmetics' => self::cleanCosmetics(is_array($d['cosmetics'] ?? null) ? $d['cosmetics'] : []),
        ];
    }

    public function save(int $userId, array $s): void
    {
        $progressSql = $this->isPostgres()
            ? 'INSERT INTO player_progress
                    (user_id, honey, location_no, level, diamonds, upgrades,
                     mission_index, missions_done, missions_finished, stats, cosmetics)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT (user_id) DO UPDATE SET
                    honey = EXCLUDED.honey, location_no = EXCLUDED.location_no, level = EXCLUDED.level,
                    diamonds = EXCLUDED.diamonds, upgrades = EXCLUDED.upgrades,
                    mission_index = EXCLUDED.mission_index, missions_done = EXCLUDED.missions_done,
                    missions_finished = EXCLUDED.missions_finished, stats = EXCLUDED.stats,
                    cosmetics = EXCLUDED.cosmetics, updated_at = CURRENT_TIMESTAMP'
            : 'INSERT INTO player_progress
                    (user_id, honey, location_no, level, diamonds, upgrades,
                     mission_index, missions_done, missions_finished, stats, cosmetics)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    honey = VALUES(honey), location_no = VALUES(location_no), level = VALUES(level),
                    diamonds = VALUES(diamonds), upgrades = VALUES(upgrades),
                    mission_index = VALUES(mission_index), missions_done = VALUES(missions_done),
                    missions_finished = VALUES(missions_finished), stats = VALUES(stats),
                    cosmetics = VALUES(cosmetics), updated_at = CURRENT_TIMESTAMP';

        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare($progressSql)->execute([
                $userId,
                $s['honey'],
                $s['location'] + 1,
                $s['level'],
                $s['diamonds'],
                self::encode($s['upgrades'] + ['staff' => $s['staff'] ?? 1]),
                $s['missions']['index'],
                self::encode($s['missions']['done']),
                $s['missions']['finished'] ? 1 : 0,
                self::encode($s['stats']),
                self::encode($s['cosmetics']),
            ]);

            $this->pdo->prepare('DELETE FROM player_stations WHERE user_id = ?')->execute([$userId]);
            $ins = $this->pdo->prepare(
                'INSERT INTO player_stations
                    (user_id, slot, unlocked, staff, recipe_lvl, work_lvl, profit_x2)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            foreach ($s['stations'] as $slot => $st) {
                // staff/work_lvl/profit_x2 are legacy columns. New saves keep
                // the real values in player_progress (staff) and upgrades.
                $ins->execute([$userId, $slot, $st['unlocked'] ? 1 : 0, 0, $st['recipe'], 0, 0]);
            }
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /** Worker slots unlocked by recipe milestones at 2, 6 and 10. */
    public static function slotsForRecipe(int $recipe): int
    {
        $slots = 1;
        foreach ([2, 6, 10] as $milestone) {
            if ($recipe >= $milestone) {
                $slots++;
            }
        }
        return $slots;
    }

    /** PostgreSQL needs ON CONFLICT; MySQL/MariaDB use ON DUPLICATE KEY. */
    private function isPostgres(): bool
    {
        return $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql';
    }

    private static function locationForLevel(int $level): int
    {
        return $level <= 4 ? 0 : ($level <= 7 ? 1 : 2);
    }

    private static function clampInt(mixed $v, int $min, int $max): int
    {
        $n = (int)$v;
        return max($min, min($max, $n));
    }

    private static function clampFloat(mixed $v, float $min, float $max): float
    {
        $n = (float)$v;
        if (!is_finite($n)) {
            return $min;
        }
        return max($min, min($max, $n));
    }

    /** Clamp staff to the open worker slots so a crafted save cannot over-hire. */
    private static function clampStaff(mixed $staff, array $stations): int
    {
        $slots = 0;
        foreach ($stations as $st) {
            if ($st['unlocked']) {
                $slots += self::slotsForRecipe($st['recipe']);
            }
        }
        return max(1, min(self::MAX_STAFF, $slots, (int)$staff));
    }

    private function decode(?string $json, array $default): array
    {
        if (!$json) {
            return $default;
        }
        $v = json_decode($json, true);
        return is_array($v) ? $v : $default;
    }

    private static function encode(mixed $value): string
    {
        $json = json_encode($value, JSON_UNESCAPED_UNICODE);
        return $json === false ? '[]' : $json;
    }

    private static function cleanUpgrades(array $u, int $legacyCook = 0, int $legacyProfit = 0): array
    {
        $fallbacks = ['cookSpeed' => $legacyCook, 'profitX2' => $legacyProfit];
        $out = [];
        foreach (self::GLOBAL_MAX as $id => $max) {
            $out[$id] = self::clampInt($u[$id] ?? $fallbacks[$id] ?? 0, 0, $max);
        }
        return $out;
    }

    private static function cleanStats(array $s): array
    {
        return [
            'served' => self::clampInt($s['served'] ?? 0, 0, 1000000000),
            'earned' => self::clampFloat($s['earned'] ?? 0, 0, self::MAX_HONEY),
            'tips' => self::clampInt($s['tips'] ?? 0, 0, 1000000000),
            'tipHoney' => self::clampFloat($s['tipHoney'] ?? 0, 0, self::MAX_HONEY),
        ];
    }

    private static function cleanDone(mixed $done): array
    {
        if (!is_array($done)) {
            return [];
        }
        $out = [];
        foreach ($done as $id) {
            if (is_string($id) && preg_match('/^[a-z0-9_]{1,40}$/i', $id)) {
                $out[] = $id;
            }
        }
        return array_values(array_unique(array_slice($out, 0, 100)));
    }

    private static function cleanCosmetics(array $c): array
    {
        $owned = [];
        if (is_array($c['owned'] ?? null)) {
            foreach ($c['owned'] as $id) {
                if (is_string($id) && preg_match('/^[a-z0-9_-]{1,40}$/i', $id)) {
                    $owned[] = $id;
                }
            }
        }
        $equipped = [];
        foreach (['bee', 'theme'] as $key) {
            $v = $c['equipped'][$key] ?? '';
            $equipped[$key] = is_string($v) && preg_match('/^[a-z0-9_-]{1,40}$/i', $v) ? $v : '';
        }
        return [
            'owned' => array_values(array_unique(array_slice($owned, 0, 50))),
            'equipped' => $equipped,
        ];
    }
}
