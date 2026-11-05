<?php
/** Thin wrapper around the PHP session that login.php / google-login.php already fill in. */
class Auth
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
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
