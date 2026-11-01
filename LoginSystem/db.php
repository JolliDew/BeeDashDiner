<<<<<<< HEAD
<?php
$host = 'aws-0-ap-southeast-2.pooler.supabase.com'; // Your project region pooler host
$db   = 'postgres';
$user = 'postgres.mojfxfvqltzbvcmkaqmt'; // Your full Supabase database user string (with project reference)
$pass = 'dKBcFiCK67L$*eL'; // Your actual database password
$port = '6543'; // Pooler port

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$db;sslmode=require";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 4 // Fails in 4 seconds instead of hanging forever on a slow connection
    ]);
} catch (\PDOException $e) {
    // Clean fallback UI when connection times out or fails
    echo '
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 80px; color: #333;">
        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
        <h2 style="margin-bottom: 5px;">Connection Timeout</h2>
        <p style="color: #666; margin-bottom: 20px;">We couldn\'t reach the database server. Your internet connection might be slow or unstable.</p>
        <button onclick="location.reload();" style="padding: 10px 22px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500;">Try Again</button>
    </div>';
    exit();
}
=======
<?php
$host = 'localhost';
$db   = 'jollidew_db'; // Change to your database name if different
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
} catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
>>>>>>> 34b31a7b8664b5df7dd166804c984880f1465f09
?>