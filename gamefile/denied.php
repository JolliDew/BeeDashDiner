<?php
require_once 'db.php';
require_once 'src/Auth.php';
Auth::start();
http_response_code(403);
$from = (string)($_GET['from'] ?? '');
$message = $from === 'admin'
    ? 'The admin panel is only available to administrator accounts.'
    : 'You do not have permission to open this page.';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access denied - BeeDashDiner</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="css/site-nav.css?v=<?= @filemtime(__DIR__ . '/css/site-nav.css') ?: 1 ?>">
    <link rel="stylesheet" href="css/pages.css">
</head>
<body class="page has-nav">
<?php $navActive = ''; include 'includes/nav.php'; ?>
<main class="page-wrap">
    <section class="page-card">
        <h1>Access denied</h1>
        <p><?= htmlspecialchars($message) ?></p>
        <p>Your role is <strong><?= htmlspecialchars(Auth::role()) ?></strong>. If you believe this is a mistake, ask an administrator to check your account.</p>
        <div class="page-actions">
            <?php if (Auth::userId()): ?>
                <a class="btn-gold" href="Mainmenu.php">Back to game</a>
                <a class="btn-ghost" href="profile.php">My profile</a>
            <?php else: ?>
                <a class="btn-gold" href="login.php">Log in</a>
            <?php endif; ?>
        </div>
    </section>
</main>
</body>
</html>
