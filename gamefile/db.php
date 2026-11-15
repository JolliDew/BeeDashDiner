<?php
$host = 'aws-0-ap-southeast-2.pooler.supabase.com';
$db   = 'postgres';
$user = 'postgres.mojfxfvqltzbvcmkaqmt';
$pass = 'dKBcFiCK67L$*eL';
$port = '5432';

try {
    // Changed sslmode from 'require' to 'prefer', and added options to bypass local SSL cert checks
    $dsn = "pgsql:host=$host;port=$port;dbname=$db;sslmode=prefer";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 10,
        PDO::ATTR_PERSISTENT => false,
        // This tells PDO to bypass strict SSL verification on Windows/XAMPP
        PDO::PGSQL_ATTR_DISABLE_PREPARES => true,
    ]);
    
    // If it reaches here, it connected successfully!
} catch (\PDOException $e) {
    echo "Database connection failed: " . $e->getMessage();
    exit();
}
?>