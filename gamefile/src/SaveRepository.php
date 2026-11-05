<?php
/** Reads and writes one player's progress. Uses the PDO connection from db.php. */
class SaveRepository
{
    private const STATIONS_PER_LOCATION = [3, 4, 5];
    private const MAX_BEES = 3;
    private const MAX_RECIPE = 8;

    public function __construct(private PDO $pdo) {}

    public function load(int $userId): ?array
    {
        $q = $this->pdo->prepare('SELECT honey, location_no FROM player_progress WHERE user_id = ?');
        $q->execute([$userId]);
        $p = $q->fetch();
        if (!$p) {
            return null;
        }
        $q = $this->pdo->prepare('SELECT unlocked, staff, recipe_lvl FROM player_stations WHERE user_id = ? ORDER BY slot');
        $q->execute([$userId]);
        $stations = array_map(fn($r) => [
            'unlocked' => (bool)$r['unlocked'],
            'staff'    => (int)$r['staff'],
            'recipe'   => (int)$r['recipe_lvl'],
        ], $q->fetchAll());
        return ['honey' => (float)$p['honey'], 'location' => (int)$p['location_no'] - 1, 'stations' => $stations];
    }

    /** Validates and clamps client data. Returns null if the shape is wrong. */
    public static function clean(mixed $d): ?array
    {
        if (!is_array($d) || !isset($d['honey'], $d['location'], $d['stations']) || !is_array($d['stations'])) {
            return null;
        }
        $loc = (int)$d['location'];
        if ($loc < 0 || $loc >= count(self::STATIONS_PER_LOCATION) || count($d['stations']) !== self::STATIONS_PER_LOCATION[$loc]) {
            return null;
        }
        $stations = [];
        foreach (array_values($d['stations']) as $s) {
            if (!is_array($s)) {
                return null;
            }
            $stations[] = [
                'unlocked' => !empty($s['unlocked']),
                'staff'    => max(0, min(self::MAX_BEES, (int)($s['staff'] ?? 0))),
                'recipe'   => max(0, min(self::MAX_RECIPE, (int)($s['recipe'] ?? 0))),
            ];
        }
        return ['honey' => max(0.0, min(1e15, (float)$d['honey'])), 'location' => $loc, 'stations' => $stations];
    }

    public function save(int $userId, array $s): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare(
                'INSERT INTO player_progress (user_id, honey, location_no) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE honey = VALUES(honey), location_no = VALUES(location_no)'
            )->execute([$userId, $s['honey'], $s['location'] + 1]);

            $this->pdo->prepare('DELETE FROM player_stations WHERE user_id = ?')->execute([$userId]);
            $ins = $this->pdo->prepare(
                'INSERT INTO player_stations (user_id, slot, unlocked, staff, recipe_lvl) VALUES (?, ?, ?, ?, ?)'
            );
            foreach ($s['stations'] as $slot => $st) {
                $ins->execute([$userId, $slot, $st['unlocked'] ? 1 : 0, $st['staff'], $st['recipe']]);
            }
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
