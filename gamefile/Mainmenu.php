<?php
require_once 'db.php';
require_once 'src/Auth.php';
require_once 'src/Csrf.php';
Auth::start();

// Re-read the account so a deleted user or changed role takes effect now.
$me = Auth::refresh($pdo);
if (!$me) {
    header("Location: login.php");
    exit();
}
$isAdmin = ($me['role'] ?? 'player') === 'admin';
$menuCssV = @filemtime(__DIR__ . '/Mainmenu.css') ?: 1;
$menuProgress = null;
try {
    $q = $pdo->prepare('SELECT level, honey, missions_finished FROM player_progress WHERE user_id = ?');
    $q->execute([$me['id']]);
    $menuProgress = $q->fetch() ?: null;
} catch (PDOException $e) {
    $menuProgress = null;
}
$menuFlash = $_SESSION['menu_flash'] ?? '';
unset($_SESSION['menu_flash']);

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
    <title>BeeDashDiner - Game</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <!-- Bootstrap first so Mainmenu.css wins any clash. The game modals need Bootstrap 4 + jQuery. -->
    <link rel="stylesheet" href="vendor/bootstrap/bootstrap.min.css">
    <link rel="stylesheet" href="Mainmenu.css?v=<?= $menuCssV ?>">
    <link rel="stylesheet" href="css/site-nav.css">
</head>
<body class="has-nav">
    <?php $navActive = 'game'; include 'includes/nav.php'; ?>

    <!-- Main Menu Screen -->
    <div id="main-menu" class="menu-container">
        <h1 class="game-title">BeeDashDiner</h1>
        
        <?php 
            $playerName = isset($_SESSION['username']) ? $_SESSION['username'] : "Player";
            echo "<p class='welcome-text'>Welcome back, <strong>" . htmlspecialchars($playerName) . "</strong>!</p>";
        ?>

        <?php if ($menuFlash): ?>
            <p class="menu-flash"><?= htmlspecialchars($menuFlash) ?></p>
        <?php endif; ?>

        <?php if ($menuProgress): ?>
            <p class="menu-progress">
                Level <?= (int)$menuProgress['level'] ?>/10 · 🍯 <?= htmlspecialchars(number_format((float)$menuProgress['honey'])) ?>
            </p>
            <?php if (!empty($menuProgress['missions_finished'])): ?>
                <p class="menu-win">🏆 Game complete — you finished all 10 levels!</p>
            <?php endif; ?>
        <?php endif; ?>

        <div class="menu-buttons">
            <button class="menu-btn play-btn" onclick="startGame()">Play Game</button>
            <?php if ($isAdmin): ?>
                <a href="admin.php" class="menu-btn admin-btn">Admin Panel</a>
            <?php endif; ?>
            <a href="logout.php" class="menu-btn quit-btn">Log Out</a>
        </div>

        <a class="menu-help" href="help.php">How to play</a>

        <form action="restart.php" method="POST" class="restart-form"
              onsubmit="return confirm('Delete all saved progress for this account? This cannot be undone.');">
            <?= Csrf::field() ?>
            <button class="restart-btn" type="submit">Restart progress</button>
        </form>
    </div>

    <!-- Link to your JavaScript file -->
    <script src="vendor/jquery/jquery.min.js"></script>
    <script src="vendor/bootstrap/bootstrap.bundle.min.js"></script>
    <script src="Mainmenu.js"></script>
</body>
</html>
