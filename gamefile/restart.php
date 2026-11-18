<?php
require_once 'db.php';
require_once 'src/Auth.php';
require_once 'src/Csrf.php';
Auth::start();

if (Auth::userId() === null) {
    header('Location: login.php');
    exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf_token'] ?? null)) {
    header('Location: Mainmenu.php');
    exit();
}

$userId = Auth::userId();
$pdo->beginTransaction();
try {
    $pdo->prepare('DELETE FROM player_stations WHERE user_id = ?')->execute([$userId]);
    $pdo->prepare('DELETE FROM player_progress WHERE user_id = ?')->execute([$userId]);
    $pdo->commit();
    $_SESSION['menu_flash'] = 'Progress reset. Your next game starts at Level 1.';
} catch (Throwable $e) {
    $pdo->rollBack();
    $_SESSION['menu_flash'] = 'Progress could not be reset. Please try again.';
}
header('Location: Mainmenu.php');
exit();
