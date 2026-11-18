<?php
require_once 'db.php';
require_once 'src/Auth.php';
require_once 'src/Csrf.php';
Auth::start();
$authCssV = @filemtime(__DIR__ . '/logindesign.css') ?: 1;
$googleAvailable = is_file(__DIR__ . '/src/google-config.php');
if (Auth::userId() !== null) {
    header('Location: Mainmenu.php');
    exit();
}
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$error = '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (!Csrf::check($_POST['csrf_token'] ?? null)) {
        $error = "Your session expired. Please try again.";
    } else {
        $identifier = trim($_POST['identifier'] ?? ''); // Username or Email
        $password = $_POST['password'] ?? '';

        if ($identifier === '' || $password === '') {
            $error = "Please fill in all fields.";
        } else {
            // Check if user exists by username or email
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$identifier, $identifier]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
                    $pdo->prepare('UPDATE users SET password = ? WHERE id = ?')
                        ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
                }
                Auth::login($user);
                header("Location: Mainmenu.php");
                exit();
            }
            if ($user
                && (($user['auth_provider'] ?? 'local') === 'google')
                && (int)($user['password_set'] ?? 1) === 0) {
                $error = 'This account uses Google sign-in. Use "Sign in with Google" first, then set a local password from Profile.';
            } else {
                $error = "Invalid username/email or password.";
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - JolliDew</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <!-- Uses the same separate CSS file -->
    <link rel="stylesheet" href="logindesign.css?v=<?= $authCssV ?>">
    <link rel="stylesheet" href="css/site-nav.css">
</head>
<body class="has-nav">
    <?php $navActive = 'login'; include 'includes/nav.php'; ?>

    <!-- Background Animated Lines -->
    <div class="lines">
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
    </div>

    <div class="card">
        <!-- Header -->
        <div class="header">
            <h1>Welcome Back</h1>
            <p>Please enter your details to log in.</p>
        </div>

        <!-- Error Messages -->
        <?php if (!empty($error)): ?>
            <div class="alert error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <!-- Login Form -->
        <form action="login.php" method="POST">
            <?= Csrf::field() ?>
            <div class="input-group">
                <label for="identifier">Username or Email</label>
                <input type="text" id="identifier" name="identifier" required placeholder="Enter your username or email">
            </div>

            <div class="input-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required placeholder="••••••••">
            </div>

            <button type="submit" class="btn-primary">Log In</button>
        </form>

        <?php if ($googleAvailable): ?>
        <!-- Divider -->
        <div class="divider">
            <span>Or</span>
        </div>

        <!-- Google Login Button -->
        <a href="google-login.php" class="btn-google">
            <svg class="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.2v3.15C3.16 21.32 7.22 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.49-.38-2.25s.13-1.53.38-2.25V6.6H1.2C.43 8.15 0 9.89 0 12s.43 3.85 1.2 5.4l4.08-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.16 2.68 1.2 6.6l4.08 3.15c.95-2.84 3.6-4.95 6.72-4.95z"/>
            </svg>
            Sign in with Google
        </a>
        <p class="login-note">Google accounts can add a local password later from Profile.</p>
        <?php endif; ?>

        <!-- Footer Link -->
        <p class="footer-text">
            Don't have an account? <a href="register.php">Register</a>
        </p>
    </div>

</body>
</html>