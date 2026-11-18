<?php
require_once 'db.php';
require_once 'src/Auth.php';
require_once 'src/Csrf.php';
Auth::start();
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if (Auth::userId() === null) {
    header('Location: login.php');
    exit();
}
$me = Auth::refresh($pdo);
if (!$me) {
    header('Location: login.php');
    exit();
}
$userId = (int)$me['id'];
$flash = '';
$flashType = '';

$avatar = '';
$createdAt = '';
$authProvider = 'local';
$passwordSet = 1;
try {
    $q = $pdo->prepare('SELECT avatar, created_at, auth_provider, password_set FROM users WHERE id = ?');
    $q->execute([$userId]);
    $account = $q->fetch() ?: [];
    $avatar = (string)($account['avatar'] ?? '');
    $createdAt = (string)($account['created_at'] ?? '');
    $authProvider = (string)($account['auth_provider'] ?? 'local');
    $passwordSet = (int)($account['password_set'] ?? 1);
} catch (PDOException $e) {
    // Older databases without the provider columns still work as local accounts.
}

$needsPasswordSetup = $authProvider === 'google' && $passwordSet === 0;

$progress = null;
try {
    $q = $pdo->prepare('SELECT level, honey, diamonds, updated_at FROM player_progress WHERE user_id = ?');
    $q->execute([$userId]);
    $progress = $q->fetch() ?: null;
} catch (PDOException $e) {
    $progress = null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string)($_POST['action'] ?? '');
    if (!Csrf::check($_POST['csrf_token'] ?? null)) {
        $flash = 'Your session expired. Please try again.';
        $flashType = 'error';
    } elseif ($action === 'avatar') {
        if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            $flash = 'Choose an image smaller than 2 MB.';
            $flashType = 'error';
        } elseif ($_FILES['avatar']['size'] > 2 * 1024 * 1024) {
            $flash = 'The image must be 2 MB or smaller.';
            $flashType = 'error';
        } else {
            $tmp = $_FILES['avatar']['tmp_name'];
            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
            $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
            $sizeInfo = @getimagesize($tmp);
            if (!isset($extensions[$mime]) || !$sizeInfo
                || $sizeInfo[0] < 1 || $sizeInfo[1] < 1
                || $sizeInfo[0] * $sizeInfo[1] > 16000000) {
                $flash = 'Only JPEG, PNG or WebP images are allowed.';
                $flashType = 'error';
            } else {
                $uploads = __DIR__ . '/uploads';
                if (!is_dir($uploads)) {
                    @mkdir($uploads, 0775, true);
                }
                $name = 'avatar_' . $userId . '_' . bin2hex(random_bytes(8)) . '.' . $extensions[$mime];
                if (!move_uploaded_file($tmp, $uploads . '/' . $name)) {
                    $flash = 'The upload could not be saved. Check the uploads folder permission.';
                    $flashType = 'error';
                } else {
                    $old = $avatar;
                    $pdo->prepare('UPDATE users SET avatar = ? WHERE id = ?')
                        ->execute(['uploads/' . $name, $userId]);
                    $avatar = 'uploads/' . $name;
                    if ($old !== '' && preg_match('#^uploads/avatar_[a-z0-9._-]+$#i', $old)) {
                        $oldFile = __DIR__ . '/' . $old;
                        if (is_file($oldFile)) @unlink($oldFile);
                    }
                    $flash = 'Profile picture updated.';
                }
            }
        }
    } elseif ($action === 'password') {
        $current = (string)($_POST['current_password'] ?? '');
        $new = (string)($_POST['new_password'] ?? '');
        $confirm = (string)($_POST['confirm_password'] ?? '');
        $currentOk = $needsPasswordSetup;
        if (!$currentOk) {
            $q = $pdo->prepare('SELECT password FROM users WHERE id = ?');
            $q->execute([$userId]);
            $hash = (string)($q->fetchColumn() ?: '');
            $currentOk = password_verify($current, $hash);
        }
        if (!$currentOk) {
            $flash = 'Your current password is not correct.';
            $flashType = 'error';
        } elseif (strlen($new) < 8) {
            $flash = 'The new password needs at least 8 characters.';
            $flashType = 'error';
        } elseif ($new !== $confirm) {
            $flash = 'The new passwords do not match.';
            $flashType = 'error';
        } else {
            $pdo->prepare('UPDATE users SET password = ?, password_set = 1 WHERE id = ?')
                ->execute([password_hash($new, PASSWORD_DEFAULT), $userId]);
            $passwordSet = 1;
            $wasSetup = $needsPasswordSetup;
            $needsPasswordSetup = false;
            session_regenerate_id(true);
            $flash = $wasSetup
                ? 'Local password set. You can now sign in manually with your email or username.'
                : 'Password changed.';
        }
    }
}

$avatarPath = $avatar;
$avatarOk = $avatarPath !== ''
    && preg_match('#^uploads/avatar_[a-z0-9._-]+$#i', $avatarPath)
    && is_file(__DIR__ . '/' . $avatarPath);
$initial = strtoupper(substr((string)$me['username'], 0, 1));
$signInMethod = $authProvider === 'google'
    ? ($passwordSet ? 'Google + local password' : 'Google sign-in')
    : 'password sign-in';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile - BeeDashDiner</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="css/site-nav.css">
    <link rel="stylesheet" href="css/pages.css">
</head>
<body class="page has-nav">
<?php $navActive = 'profile'; include 'includes/nav.php'; ?>
<main class="page-wrap">
    <section class="page-card">
        <h1>My profile</h1>
        <?php if ($flash): ?>
            <div class="flash <?= $flashType === 'error' ? 'error' : '' ?>"><?= htmlspecialchars($flash) ?></div>
        <?php endif; ?>

        <div class="profile-grid">
            <div>
                <?php if ($avatarOk): ?>
                    <img class="avatar-preview" src="<?= htmlspecialchars($avatarPath) ?>" alt="Your profile picture">
                <?php else: ?>
                    <div class="avatar-preview avatar-fallback" aria-label="No profile picture"><?= htmlspecialchars($initial) ?></div>
                <?php endif; ?>
            </div>
            <div>
                <p><strong><?= htmlspecialchars((string)$me['username']) ?></strong><br>
                    <?= htmlspecialchars((string)$me['email']) ?> · <span class="muted"><?= htmlspecialchars((string)$me['role']) ?></span><br>
                    <span class="muted">Sign-in: <?= htmlspecialchars($signInMethod) ?></span>
                </p>
                <?php if ($progress): ?>
                    <div class="progress-line">
                        <span>Level <?= (int)$progress['level'] ?>/10</span>
                        <span>🍯 <?= htmlspecialchars(number_format((float)$progress['honey'])) ?></span>
                        <span>💎 <?= (int)$progress['diamonds'] ?></span>
                    </div>
                <?php else: ?>
                    <p class="muted">No game save yet. Start a game to create one.</p>
                <?php endif; ?>
                <div class="page-actions">
                    <a class="btn-gold" href="Mainmenu.php">Play Game</a>
                    <a class="btn-ghost" href="help.php">How to play</a>
                </div>
            </div>
        </div>

        <h2>Profile picture</h2>
        <form action="profile.php" method="POST" enctype="multipart/form-data">
            <?= Csrf::field() ?>
            <input type="hidden" name="action" value="avatar">
            <div class="form-row">
                <label for="avatar">JPEG, PNG or WebP, up to 2 MB</label>
                <input type="file" id="avatar" name="avatar" accept="image/jpeg,image/png,image/webp" required>
            </div>
            <button class="btn-gold" type="submit">Upload picture</button>
        </form>

        <h2><?= $needsPasswordSetup ? 'Set a local password' : 'Change password' ?></h2>
        <?php if ($needsPasswordSetup): ?>
            <p class="muted">This account was created with Google, so BeeDashDiner never received your Google password. Set a password here if you also want to sign in with your email or username. Google sign-in will keep working.</p>
        <?php endif; ?>
        <form action="profile.php" method="POST">
            <?= Csrf::field() ?>
            <input type="hidden" name="action" value="password">
            <?php if (!$needsPasswordSetup): ?>
                <div class="form-row">
                    <label for="current_password">Current password</label>
                    <input type="password" id="current_password" name="current_password" autocomplete="current-password" required>
                </div>
            <?php endif; ?>
            <div class="form-row">
                <label for="new_password"><?= $needsPasswordSetup ? 'Password' : 'New password' ?> (8+ characters)</label>
                <input type="password" id="new_password" name="new_password" autocomplete="new-password" minlength="8" required>
            </div>
            <div class="form-row">
                <label for="confirm_password">Confirm password</label>
                <input type="password" id="confirm_password" name="confirm_password" autocomplete="new-password" minlength="8" required>
            </div>
            <button class="btn-gold" type="submit"><?= $needsPasswordSetup ? 'Set password' : 'Change password' ?></button>
        </form>
    </section>
</main>
</body>
</html>
