<?php
/**
 * PostgreSQL / Supabase connection template.
 *
 * Copy this file to gamefile/db.php and fill in the values from your
 * Supabase project (Project Settings > Database > Connection pooler):
 *
 *   cp gamefile/db.postgres.example.php gamefile/db.php
 *
 * Then import gamefile/login_db_pg.sql once. db.php is ignored by git,
 * so the real password never gets committed.
 *
 * Requirements: PHP with the pdo_pgsql extension. It is enabled in the
 * stock PHP builds used by this project; check with `php -m | grep pgsql`.
 */
$host = 'aws-0-REGION.pooler.supabase.com';
$port = '5432';
$db   = 'postgres';
$user = 'postgres.PROJECT_REF';
$pass = 'YOUR_DATABASE_PASSWORD';

$dsn = "pgsql:host=$host;port=$port;dbname=$db;sslmode=prefer";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_TIMEOUT            => 10,
    PDO::ATTR_PERSISTENT         => false,
];

// Supabase's pooler works best when PDO does not use server-side prepared
// statements. PHP 8.5 moved this constant to the Pdo\Pgsql class.
if (PHP_VERSION_ID >= 80500 && class_exists('Pdo\\Pgsql')) {
    $options[\Pdo\Pgsql::ATTR_DISABLE_PREPARES] = true;
} elseif (defined('PDO::PGSQL_ATTR_DISABLE_PREPARES')) {
    $options[PDO::PGSQL_ATTR_DISABLE_PREPARES] = true;
}

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    exit(
        'Database connection failed. Check gamefile/db.php and make sure ' .
        'PostgreSQL is reachable and login_db_pg.sql has been imported. ' .
        'Details: ' . $e->getMessage()
    );
}
