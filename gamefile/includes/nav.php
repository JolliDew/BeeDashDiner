<?php
/**
 * Shared navigation for every page. Include after <body> and add
 * class="has-nav" to <body>; css/site-nav.css provides the offset.
 *
 * Set $navActive to one of: login, register, game, help, profile, admin.
 */
if (!class_exists('Auth')) {
    require_once __DIR__ . '/../src/Auth.php';
}
Auth::start();

$navUser = null;
$navAvatar = '';
$navIsAdmin = Auth::isAdmin();
if (Auth::userId()) {
    $navUser = [
        'username' => Auth::username(),
        'role' => Auth::role(),
    ];
    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $q = $pdo->prepare('SELECT username, role, avatar FROM users WHERE id = ?');
            $q->execute([Auth::userId()]);
            if ($row = $q->fetch()) {
                $navUser = $row;
                $navAvatar = (string)($row['avatar'] ?? '');
            }
            $navIsAdmin = (($navUser['role'] ?? 'player') === 'admin');
        } catch (PDOException $e) {
            // A database that has not received the avatar migration still
            // gets the session's username/role.
        }
    }
}
$navActive = $navActive ?? '';
$navAvatar = preg_replace('#^uploads/#', '', $navAvatar);
$navAvatar = $navAvatar !== '' && preg_match('/^[a-z0-9._-]+$/i', $navAvatar)
    && is_file(__DIR__ . '/../uploads/' . $navAvatar) ? 'uploads/' . $navAvatar : '';
$navHome = 'index.php';
?>
<header class="site-nav">
    <div class="site-nav-inner">
        <a class="site-brand" href="<?= htmlspecialchars($navHome) ?>"><span aria-hidden="true">🍯</span> BeeDashDiner</a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav-links" aria-label="Open navigation">☰</button>
        <nav id="site-nav-links" class="site-nav-links" aria-label="Main navigation">
            <a href="index.php"<?= $navActive === 'home' ? ' aria-current="page"' : '' ?>>Home</a>
            <?php if (Auth::userId()): ?>
                <a href="Mainmenu.php"<?= $navActive === 'game' ? ' aria-current="page"' : '' ?>>Game</a>
                <a href="help.php"<?= $navActive === 'help' ? ' aria-current="page"' : '' ?>>How to play</a>
                <a href="profile.php"<?= $navActive === 'profile' ? ' aria-current="page"' : '' ?>>
                    <?php if ($navAvatar): ?>
                        <img class="nav-avatar" src="<?= htmlspecialchars($navAvatar) ?>" alt="">
                    <?php else: ?>
                        <span class="nav-avatar nav-avatar-fallback" aria-hidden="true"><?= htmlspecialchars(strtoupper(substr((string)($navUser['username'] ?? 'P'), 0, 1))) ?></span>
                    <?php endif; ?>
                    <?= htmlspecialchars((string)($navUser['username'] ?? Auth::username())) ?>
                </a>
                <?php if ($navIsAdmin): ?>
                    <a href="admin.php"<?= $navActive === 'admin' ? ' aria-current="page"' : '' ?>>Admin</a>
                <?php endif; ?>
                <a class="nav-logout" href="logout.php">Log out</a>
            <?php else: ?>
                <a href="help.php"<?= $navActive === 'help' ? ' aria-current="page"' : '' ?>>How to play</a>
                <a href="login.php"<?= $navActive === 'login' ? ' aria-current="page"' : '' ?>>Log in</a>
                <a href="register.php"<?= $navActive === 'register' ? ' aria-current="page"' : '' ?>>Register</a>
            <?php endif; ?>
        </nav>
    </div>
</header>
<script>
(() => {
    const button = document.querySelector('.nav-toggle');
    const links = document.getElementById('site-nav-links');
    if (!button || !links) return;
    button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!open));
        links.classList.toggle('open', !open);
    });
})();
</script>
