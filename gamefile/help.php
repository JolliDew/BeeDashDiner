<?php
require_once 'db.php';
require_once 'src/Auth.php';
Auth::start();
$loggedIn = Auth::userId() !== null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>How to Play - BeeDashDiner</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="css/site-nav.css?v=<?= @filemtime(__DIR__ . '/css/site-nav.css') ?: 1 ?>">
    <link rel="stylesheet" href="css/pages.css">
</head>
<body class="page has-nav">
<?php $navActive = 'help'; include 'includes/nav.php'; ?>
<main class="page-wrap">
    <section class="page-card">
        <h1>How to play BeeDashDiner</h1>
        <p>You run a small bee café. Guests arrive, your bees cook automatically, and the honey you earn buys more seats, workers, recipes and restaurants.</p>

        <h2>Your goal</h2>
        <p>Complete the three missions on each level and reach <strong>Level 10</strong> at the <strong>Royal Hive</strong>. Finishing every level wins the game.</p>

        <h2>Controls</h2>
        <ul>
            <li>Press <strong>Play Game</strong> on the menu to enter the café.</li>
            <li>Click or tap a <strong>food stall</strong> to open its recipe and worker upgrades.</li>
            <li>Use the bottom dock for <strong>Mission</strong>, <strong>Upgrades</strong> and <strong>Shop</strong>.</li>
            <li>Use the <strong>speaker</strong> button to set separate sound-effects and music volumes.</li>
            <li>Press <strong>Exit</strong> to save and return to the menu.</li>
        </ul>

        <h2>How the café works</h2>
        <ul>
            <li>Bees are automatic: they take an order, cook at its station, serve the guest, and return for the next job.</li>
            <li>Every station has recipe levels. Milestones at 2, 6 and 10 add worker slots; milestones at 4 and 8 double that station's profit.</li>
            <li>Hire more bees and buy restaurant-wide upgrades in <strong>Upgrades</strong>.</li>
            <li>Diamonds from missions and level rewards buy cosmetic accessories in <strong>Shop</strong>.</li>
            <li>Guests enter and leave only through the lower-left door. Your progress saves automatically.</li>
        </ul>

        <h2>Winning and restarting</h2>
        <p>There is no way to lose. The win condition is completing all ten levels. If you want a fresh start, use <strong>Restart progress</strong> on the main menu — after confirmation it replaces only your own save with a fresh game.</p>

        <div class="page-actions">
            <?php if ($loggedIn): ?>
                <a class="btn-gold" href="Mainmenu.php">Play Game</a>
                <a class="btn-ghost" href="profile.php">Profile</a>
            <?php else: ?>
                <a class="btn-gold" href="login.php">Log in to play</a>
                <a class="btn-ghost" href="register.php">Create an account</a>
            <?php endif; ?>
        </div>
    </section>
</main>
</body>
</html>
