<?php
/** Thin wrapper around the PHP session used by login.php / google-login.php / admin.php. */
class Auth
{
    public static function start(): void
    {
        if (session_status() !== PHP_SESSION_NONE) {
            return;
        }

        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['SERVER_PORT'] ?? '') === '443')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    public static function userId(): ?int
    {
        self::start();
        return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    }

    public static function username(): string
    {
        self::start();
        return $_SESSION['username'] ?? 'Player';
    }

    public static function role(): string
    {
        self::start();
        return $_SESSION['role'] ?? 'player';
    }

    public static function isAdmin(): bool
    {
        return self::role() === 'admin';
    }

    /** Store a verified account in the session after login or registration. */
    public static function login(array $user): void
    {
        self::start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['username'] = (string)$user['username'];
        $_SESSION['role'] = ($user['role'] ?? 'player') === 'admin' ? 'admin' : 'player';
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $p['path'],
                'domain' => $p['domain'],
                'secure' => $p['secure'],
                'httponly' => $p['httponly'],
                'samesite' => 'Lax',
            ]);
        }
        session_destroy();
    }

    /**
     * Re-read the account so a deleted user or demoted admin loses access
     * immediately, even if their session was created earlier.
     *
     * $requireRole = true makes a missing `role` column visible to admin.php,
     * which can then show the migration message. The game and API keep the
     * fallback so an unmigrated database can still be played.
     */
    public static function refresh(PDO $pdo, bool $requireRole = false): ?array
    {
        $id = self::userId();
        if ($id === null) {
            return null;
        }
        try {
            $q = $pdo->prepare('SELECT id, username, email, role FROM users WHERE id = ?');
            $q->execute([$id]);
            $user = $q->fetch();
        } catch (PDOException $e) {
            if ($requireRole) {
                throw $e;
            }
            // Databases created before the admin migration still work for the
            // game; only admin.php requires the role column.
            $q = $pdo->prepare('SELECT id, username, email FROM users WHERE id = ?');
            $q->execute([$id]);
            $user = $q->fetch();
            if ($user) {
                $user['role'] = 'player';
            }
        }
        if (!$user) {
            self::logout();
            return null;
        }
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = ($user['role'] ?? 'player') === 'admin' ? 'admin' : 'player';
        return $user;
    }

    /** Returns the user id, or sends the visitor away. $http = true answers 401 text (for fetch calls). */
    public static function requireLogin(bool $http = false): int
    {
        $id = self::userId();
        if ($id === null) {
            if ($http) {
                http_response_code(401);
                exit('Please log in again.');
            }
            header('Location: login.php');
            exit();
        }
        return $id;
    }
}
