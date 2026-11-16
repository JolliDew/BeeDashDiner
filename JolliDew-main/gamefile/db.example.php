<?php
/**
 * Copy this file to gamefile/db.php and adjust the values for your machine.
 *
 *   cp gamefile/db.example.php gamefile/db.php
 *
 * db.php is ignored by git, so your password never gets committed.
 * The defaults below match a stock XAMPP install (MySQL user "root", no password).
 */
$host = 'localhost';
$db   = 'jollidew_db';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    exit(
        'Database connection failed. Check gamefile/db.php and make sure ' .
        'MySQL is running and login_db.sql has been imported. ' .
        'Details: ' . $e->getMessage()
    );
}
