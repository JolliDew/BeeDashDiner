<?php
require_once 'db.php';
require_once 'src/Auth.php';
Auth::start();

$loggedIn = Auth::userId() !== null;
$me = $loggedIn ? Auth::refresh($pdo) : null;
$progress = null;
if ($me) {
    try {
        $q = $pdo->prepare('SELECT level, honey FROM player_progress WHERE user_id = ?');
        $q->execute([$me['id']]);
        $progress = $q->fetch() ?: null;
    } catch (PDOException $e) {
        $progress = null;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BeeDashDiner — a cosy bee café game</title>
    <meta name="description" content="BeeDashDiner is a relaxing bee café game: serve guests, grow your hive, upgrade three restaurants and complete ten levels.">
    <meta name="theme-color" content="#1b150d">
    <meta property="og:title" content="BeeDashDiner — a cosy bee café game">
    <meta property="og:description" content="A calm idle café game with automatic bees, three restaurants, missions and a honey-sweet soundtrack.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="assets/meadow.png">
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="css/site-nav.css">
    <link rel="stylesheet" href="css/pages.css">
    <link rel="stylesheet" href="css/landing.css">
</head>
<body class="page has-nav landing">
<?php $navActive = 'home'; include 'includes/nav.php'; ?>
<main class="page-wrap landing-wrap">
    <section class="landing-hero">
        <div>
            <p class="landing-eyebrow">A cosy bee café game</p>
            <h1>Run the sweetest little café in the <span>meadow.</span></h1>
            <p class="landing-lead">
                Welcome guests through the lower-left door, let your bees cook and serve, and grow a tiny
                business into three memorable restaurants. No timers, no pressure — just a calm hive,
                warm lights and one more honey pot.
            </p>
            <div class="landing-actions">
                <?php if ($loggedIn): ?>
                    <a class="btn-gold" href="Mainmenu.php"><?= $progress ? 'Continue playing' : 'Play now' ?></a>
                    <a class="btn-ghost" href="help.php">How to play</a>
                <?php else: ?>
                    <a class="btn-gold" href="login.php">Play now</a>
                    <a class="btn-ghost" href="register.php">Create account</a>
                <?php endif; ?>
            </div>
            <ul class="landing-stats">
                <li>3 restaurants</li>
                <li>10 levels</li>
                <li>Automatic bees</li>
                <li>Relaxing audio</li>
            </ul>
            <?php if ($me): ?>
                <p class="landing-lead" style="margin-top:16px;margin-bottom:0;font-size:.9rem;">
                    Signed in as <strong><?= htmlspecialchars((string)$me['username']) ?></strong><?= $progress
                        ? ' · Level ' . (int)$progress['level'] . ' · 🍯 ' . htmlspecialchars(number_format((float)$progress['honey']))
                        : '' ?>.
                </p>
            <?php endif; ?>
        </div>
        <figure class="landing-shot">
            <img src="assets/meadow.png" alt="The Meadow Stand restaurant in BeeDashDiner, with three food stalls and a cosy picnic floor" fetchpriority="high">
            <figcaption>Meadow Stand — one of three hand-built restaurant maps.</figcaption>
        </figure>
    </section>

    <section class="landing-section">
        <h2>Why it feels different</h2>
        <p>BeeDashDiner is designed to be a game you can leave running while you breathe. Everything happens at a gentle pace.</p>
        <div class="feature-grid">
            <article class="feature-card">
                <span class="ico" aria-hidden="true">🐝</span>
                <h3>A hive that works for you</h3>
                <p>Bees choose the next order, cook the dish, serve the guest and fly home. You only hire, upgrade and enjoy the view.</p>
            </article>
            <article class="feature-card">
                <span class="ico" aria-hidden="true">🏡</span>
                <h3>Three real restaurants</h3>
                <p>An outdoor meadow market, a warm café and a royal hall — each with its own floor, lighting, entrance and menu.</p>
            </article>
            <article class="feature-card">
                <span class="ico" aria-hidden="true">🎵</span>
                <h3>Made to unwind</h3>
                <p>Soft procedural music and gentle sounds, with separate volume sliders, music ducking and a calm entrance for every guest.</p>
            </article>
        </div>
    </section>

    <section class="landing-section">
        <h2>Three places, one little hive</h2>
        <p>Advance through ten levels and unlock a new restaurant at every milestone.</p>
        <div class="map-gallery">
            <article class="map-card">
                <img src="assets/meadow.png" alt="Meadow Stand map with a sky wall, bunting and green picnic floor" loading="lazy">
                <div><h3>Meadow Stand</h3><p>A sunny market with flowers, clouds and picnic blankets.</p></div>
            </article>
            <article class="map-card">
                <img src="assets/hive.png" alt="Hive Café map with pendant lamps, a jar shelf and a warm café window" loading="lazy">
                <div><h3>Hive Café</h3><p>A warm indoor café with lamps, jars and a cosy window seat.</p></div>
            </article>
            <article class="map-card">
                <img src="assets/royal.png" alt="Royal Hive map with purple walls, gold curtains, a chandelier and a red carpet" loading="lazy">
                <div><h3>Royal Hive</h3><p>A regal hall of gold, velvet, marble and a royal red carpet.</p></div>
            </article>
        </div>
    </section>

    <section class="landing-section">
        <h2>How it works</h2>
        <ol class="steps">
            <li>Sign in and open the café. Guests arrive through the lower-left door.</li>
            <li>Upgrade stalls and recipes, hire bees and complete the three missions on each level.</li>
            <li>Reach Level 10 at the Royal Hive. Progress saves automatically; restart any time from the menu.</li>
        </ol>
    </section>

    <section class="landing-final">
        <h2><?= $progress ? 'Your hive is waiting.' : 'Ready to open the café?' ?></h2>
        <p><?= $progress ? 'Continue from your saved level and honey.' : 'Create a free account, meet the bees and serve your first guest.' ?></p>
        <div class="landing-actions">
            <?php if ($loggedIn): ?>
                <a class="btn-gold" href="Mainmenu.php">Play BeeDashDiner</a>
            <?php else: ?>
                <a class="btn-gold" href="login.php">Play BeeDashDiner</a>
                <a class="btn-ghost" href="register.php">Create account</a>
            <?php endif; ?>
        </div>
    </section>

    <footer class="landing-footer">
        BeeDashDiner · AQM · University of St. La Salle · CC106 — Cloud Development · <a href="help.php">Rules</a> ·
        <?php if ($loggedIn): ?>
            <a href="Mainmenu.php">Game</a> · <a href="profile.php">Profile</a>
        <?php else: ?>
            <a href="login.php">Log in</a>
        <?php endif; ?>
    </footer>
</main>
</body>
</html>
