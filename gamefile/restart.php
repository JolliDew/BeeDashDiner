<?php
require_once 'db.php';
require_once 'src/Auth.php';
require_once 'src/Csrf.php';
require_once 'src/SaveRepository.php';
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
try {
    // The save is replaced by a fresh game instead of being deleted. The new
    // write number is far ahead of the old one, so a save that is still on
    // its way (the keepalive from Exit) cannot bring the old progress back.
    (new SaveRepository($pdo))->reset($userId);
    $_SESSION['menu_flash'] = 'Progress reset. Your next game starts at Level 1.';
} catch (Throwable $e) {
    $_SESSION['menu_flash'] = 'Progress could not be reset. Please try again.';
}
header('Location: Mainmenu.php');
exit();
