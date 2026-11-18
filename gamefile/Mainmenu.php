<?php
require_once 'db.php';
require_once 'src/Auth.php';
Auth::start();

// Re-read the account so a deleted user or changed role takes effect now.
$me = Auth::refresh($pdo);
if (!$me) {
    header("Location: login.php");
    exit();
}
$isAdmin = ($me['role'] ?? 'player') === 'admin';
$menuCssV = @filemtime(__DIR__ . '/Mainmenu.css') ?: 1;

// The menu shell must never be served from an old cache while developing.
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JolliDew - Game</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <!-- Bootstrap first so Mainmenu.css wins any clash. The game modals need Bootstrap 4 + jQuery. -->
    <link rel="stylesheet" href="vendor/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="Mainmenu.css?v=<?= $menuCssV ?>">
</head>
<body>

    <!-- Main Menu Screen -->
    <div id="main-menu" class="menu-container">
        <h1 class="game-title">BeeDashDiner</h1>
        
        <?php 
            $playerName = isset($_SESSION['username']) ? $_SESSION['username'] : "Player";
            echo "<p class='welcome-text'>Welcome back, <strong>" . htmlspecialchars($playerName) . "</strong>!</p>";
        ?>

        <div class="menu-buttons">
            <button class="menu-btn play-btn" onclick="startGame()">Play Game</button>
            <?php if ($isAdmin): ?>
                <a href="admin.php" class="menu-btn admin-btn">Admin Panel</a>
            <?php endif; ?>
            <a href="logout.php" class="menu-btn quit-btn">Log Out</a>
        </div>
    </div>

    <!-- Link to your JavaScript file -->
    <script src="vendor/jquery/jquery.min.js"></script>
    <script src="vendor/bootstrap/bootstrap.bundle.min.js"></script>
    <script src="Mainmenu.js"></script>
</body>
</html>
