<?php
/**
 * Account administration for admin.php. Works with both MySQL/MariaDB and
 * PostgreSQL; the only driver-specific code is the INSERT ... RETURNING id.
 */
class AdminRepository
{
    public const ROLES = ['player', 'admin'];
    public const MIN_PASSWORD = 8;

    public function __construct(private PDO $pdo) {}

    public function stats(): array
    {
        return [
            'users' => (int)$this->pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
            'admins' => $this->countAdmins(),
            'saves' => (int)$this->pdo->query('SELECT COUNT(*) FROM player_progress')->fetchColumn(),
        ];
    }

    /** @return array{total:int,page:int,perPage:int,users:array} */
    public function paginate(string $search = '', int $page = 1, int $perPage = 20): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(100, $perPage));
        $offset = ($page - 1) * $perPage;
        $needle = '%' . strtolower(trim($search)) . '%';
        $where = 'WHERE LOWER(u.username) LIKE ? OR LOWER(u.email) LIKE ?';

        $count = $this->pdo->prepare("SELECT COUNT(*) FROM users u $where");
        $count->execute([$needle, $needle]);
        $total = (int)$count->fetchColumn();

        $q = $this->pdo->prepare(
            "SELECT u.id, u.username, u.email, u.role, u.created_at,
                    p.level, p.honey, p.location_no, p.updated_at
             FROM users u
             LEFT JOIN player_progress p ON p.user_id = u.id
             $where
             ORDER BY u.id ASC
             LIMIT $perPage OFFSET $offset"
        );
        $q->execute([$needle, $needle]);

        return [
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'users' => $q->fetchAll(),
        ];
    }

    public function find(int $id): ?array
    {
        $q = $this->pdo->prepare(
            'SELECT u.id, u.username, u.email, u.role, u.created_at,
                    p.level, p.honey, p.location_no, p.updated_at
             FROM users u
             LEFT JOIN player_progress p ON p.user_id = u.id
             WHERE u.id = ?'
        );
        $q->execute([$id]);
        $row = $q->fetch();
        return $row ?: null;
    }

    public function create(string $username, string $email, string $password, string $role = 'player'): int
    {
        self::assertUsername($username);
        self::assertEmail($email);
        self::assertPassword($password);
        self::assertRole($role);

        $email = strtolower(trim($email));
        $username = trim($username);
        if ($this->usernameOrEmailTaken($username, $email)) {
            throw new InvalidArgumentException('Username or email is already taken.');
        }

        $sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
        $params = [$username, $email, password_hash($password, PASSWORD_DEFAULT), $role];
        if ($this->isPostgres()) {
            $stmt = $this->pdo->prepare($sql . ' RETURNING id');
            $stmt->execute($params);
            return (int)$stmt->fetchColumn();
        }
        $this->pdo->prepare($sql)->execute($params);
        return (int)$this->pdo->lastInsertId();
    }

    public function update(int $id, string $username, string $email, string $role): void
    {
        self::assertUsername($username);
        self::assertEmail($email);
        self::assertRole($role);

        $target = $this->find($id);
        if (!$target) {
            throw new InvalidArgumentException('That user no longer exists.');
        }
        if ($target['role'] === 'admin' && $role !== 'admin' && $this->countAdmins() <= 1) {
            throw new InvalidArgumentException('You cannot demote the last admin.');
        }

        $email = strtolower(trim($email));
        $username = trim($username);
        if ($this->usernameOrEmailTaken($username, $email, $id)) {
            throw new InvalidArgumentException('Username or email is already taken.');
        }

        $this->pdo->prepare('UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?')
            ->execute([$username, $email, $role, $id]);
    }

    public function setPassword(int $id, string $password): void
    {
        self::assertPassword($password);
        $this->pdo->prepare('UPDATE users SET password = ?, password_set = 1 WHERE id = ?')
            ->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
    }

    /** Delete save rows but keep the account. */
    public function resetProgress(int $id): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare('DELETE FROM player_stations WHERE user_id = ?')->execute([$id]);
            $this->pdo->prepare('DELETE FROM player_progress WHERE user_id = ?')->execute([$id]);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /** Delete the account and every row that belongs to it. */
    public function delete(int $id, int $actorId): void
    {
        $target = $this->find($id);
        if (!$target) {
            throw new InvalidArgumentException('That user no longer exists.');
        }
        if ($id === $actorId) {
            throw new InvalidArgumentException('You cannot delete your own account.');
        }
        if ($target['role'] === 'admin' && $this->countAdmins() <= 1) {
            throw new InvalidArgumentException('You cannot delete the last admin.');
        }

        $this->pdo->beginTransaction();
        try {
            // Explicit deletes keep the behaviour identical on MySQL and
            // PostgreSQL even when an older database has no cascade FKs.
            $this->pdo->prepare('DELETE FROM player_stations WHERE user_id = ?')->execute([$id]);
            $this->pdo->prepare('DELETE FROM player_progress WHERE user_id = ?')->execute([$id]);
            $this->pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Write one audit row. Pass $targetUsername after a deletion, because the
     * account no longer exists and the snapshot would otherwise be null.
     */
    public function audit(
        ?int $actorId,
        string $action,
        ?int $targetId,
        string $details = '',
        ?string $targetUsername = null
    ): void {
        $this->pdo->prepare(
            'INSERT INTO admin_audit
                (actor_id, actor_username, action, target_user_id, target_username, details)
             VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([
            $actorId,
            $actorId ? $this->usernameOf($actorId) : null,
            substr($action, 0, 40),
            $targetId,
            $targetUsername ?? ($targetId ? $this->usernameOf($targetId) : null),
            substr($details, 0, 500),
        ]);
    }

    public function audits(int $limit = 50): array
    {
        $limit = max(1, min(200, $limit));
        return $this->pdo->query(
            "SELECT * FROM admin_audit ORDER BY id DESC LIMIT $limit"
        )->fetchAll();
    }

    public function countAdmins(): int
    {
        return (int)$this->pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
    }

    public static function assertUsername(string $username): void
    {
        if (!preg_match('/^[A-Za-z0-9_]{3,50}$/', trim($username))) {
            throw new InvalidArgumentException('Usernames need 3-50 letters, numbers or underscores.');
        }
    }

    public static function assertEmail(string $email): void
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Enter a valid email address.');
        }
    }

    public static function assertPassword(string $password): void
    {
        if (strlen($password) < self::MIN_PASSWORD) {
            throw new InvalidArgumentException('Use a password with at least ' . self::MIN_PASSWORD . ' characters.');
        }
    }

    public static function assertRole(string $role): void
    {
        if (!in_array($role, self::ROLES, true)) {
            throw new InvalidArgumentException('Unknown role.');
        }
    }

    private function usernameOrEmailTaken(string $username, string $email, ?int $exceptId = null): bool
    {
        $sql = 'SELECT id FROM users WHERE (username = ? OR email = ?)';
        $params = [$username, $email];
        if ($exceptId !== null) {
            $sql .= ' AND id <> ?';
            $params[] = $exceptId;
        }
        $q = $this->pdo->prepare($sql);
        $q->execute($params);
        return (bool)$q->fetch();
    }

    private function usernameOf(int $id): ?string
    {
        $q = $this->pdo->prepare('SELECT username FROM users WHERE id = ?');
        $q->execute([$id]);
        $name = $q->fetchColumn();
        return $name === false ? null : (string)$name;
    }

    private function isPostgres(): bool
    {
        return $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql';
    }
}
