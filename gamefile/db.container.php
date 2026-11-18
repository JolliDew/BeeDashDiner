<?php
/**
 * Container database connection. The Docker image copies this file to db.php.
 * Credentials come from environment variables, never from the repository.
 *
 * Preferred: DATABASE_URL=postgres://user:pass@host:5432/dbname
 * Also supported: DB_DSN + DB_USER + DB_PASSWORD
 */

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_TIMEOUT            => 10,
    PDO::ATTR_PERSISTENT         => false,
];
if (PHP_VERSION_ID >= 80500 && class_exists('Pdo\\Pgsql')) {
    $options[\Pdo\Pgsql::ATTR_DISABLE_PREPARES] = true;
} elseif (defined('PDO::PGSQL_ATTR_DISABLE_PREPARES')) {
    $options[PDO::PGSQL_ATTR_DISABLE_PREPARES] = true;
}

$url = getenv('DATABASE_URL') ?: '';
$dsn = getenv('DB_DSN') ?: '';
$user = getenv('DB_USER') ?: '';
$pass = getenv('DB_PASSWORD') ?: '';

if ($dsn === '' && $url !== '') {
    $p = parse_url($url);
    if ($p === false || empty($p['host'])) {
        http_response_code(500);
        exit('Database configuration is invalid.');
    }
    $scheme = strtolower((string)($p['scheme'] ?? 'pgsql'));
    $host = $p['host'];
    $port = (int)($p['port'] ?? ($scheme === 'mysql' ? 3306 : 5432));
    $name = ltrim((string)($p['path'] ?? ''), '/') ?: 'postgres';
    $user = urldecode((string)($p['user'] ?? ''));
    $pass = urldecode((string)($p['pass'] ?? ''));
    if ($scheme === 'postgres' || $scheme === 'postgresql' || $scheme === 'pgsql') {
        $dsn = "pgsql:host=$host;port=$port;dbname=$name;sslmode=require";
    } else {
        $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4";
    }
}

if ($dsn === '') {
    http_response_code(500);
    exit('Database connection is not configured.');
}

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    error_log('Database connection failed: ' . $e->getMessage());
    http_response_code(500);
    exit('Database connection failed. Check the deployment environment variables.');
}
