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
        PDO::ATTR_TIMEOUT => 5 // Fail slightly faster so it doesn't hang the page
    ]);
    
    // Optional: echo "Connected successfully!";
} catch (\PDOException $e) {
    // Check if the error code indicates a timeout or connection failure (SQLSTATE 08006 or code 7)
    if ($e->getCode() === '08006' || strpos($e->getMessage(), 'timeout expired') !== false) {
        echo "Connection Timeout: Unable to reach the database. Please check your internet connection.";
    } else {
        echo "Database connection failed: " . $e->getMessage();
    }
    exit();
}
?>