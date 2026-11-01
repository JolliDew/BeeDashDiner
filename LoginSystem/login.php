<<<<<<< HEAD
<?php
session_start();
require_once 'db.php';

$error = '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $identifier = trim($_POST['identifier']); // Can be username or email
    $password =$_POST['password'];

    if (empty($identifier) || empty($password)) {$error = "Please fill in all fields.";
    } else {
        // Query Supabase to find the user by username or email
        $stmt =$pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$identifier,$identifier]);
        $user =$stmt->fetch();

        // Verify user exists and password matches the hashed password in the database
        if ($user && password_verify($password,$user['password'])) {
            // Set session variables
            $_SESSION['user_id'] =$user['id'];
            $_SESSION['username'] =$user['username'];
            
            // Redirect straight to your main menu file
            header("Location: ../MainMenu/Mainmenu.php");
        exit();
        } else {
            $error = "Invalid username/email or password.";
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
    <link rel="stylesheet" href="logindesign.css">
</head>
<body>

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
        <div class="header">
            <h1>Welcome Back</h1>
            <p>Please enter your details to log in.</p>
        </div>

        <?php if (!empty($error)): ?>
            <div class="alert error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <form action="login.php" method="POST">
            <div class="input-group">
                <label for="identifier">Username or Email</label>
                <input type="text" id="identifier" name="identifier" required placeholder="Enter your username or email" value="<?php echo isset($_POST['identifier']) ? htmlspecialchars($_POST['identifier']) : ''; ?>">
            </div>

            <div class="input-group">
                <label for="password">Password</label>
                <div class="password-wrapper">
                    <input type="password" id="password" name="password" required placeholder="••••••••">
                    <span id="togglePassword" onclick="togglePasswordVisibility()">
                        <svg id="eyeIcon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </span>
                </div>
            </div>

            <button type="submit" class="btn-primary">Log In</button>
        </form>

        <div class="divider">
            <span>Or</span>
        </div>

        <a href="google-login.php" class="btn-google">
            <svg class="google-icon" viewBox="0 0 24 24" style="width: 18px; height: 18px; margin-right: 8px; vertical-align: middle;">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.2v3.15C3.16 21.32 7.22 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.49-.38-2.25s.13-1.53.38-2.25V6.6H1.2C.43 8.15 0 9.89 0 12s.43 3.85 1.2 5.4l4.08-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.16 2.68 1.2 6.6l4.08 3.15c.95-2.84 3.6-4.95 6.72-4.95z"/>
            </svg>
            Sign in with Google
        </a>

        <p class="footer-text">
            Don't have an account? <a href="register.php">Register</a>
        </p>
    </div>

    <script>
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById("password");
            const eyeIcon = document.getElementById("eyeIcon");
            
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                eyeIcon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                passwordInput.type = "password";
                eyeIcon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        }
    </script>

</body>
=======
<?php
session_start();
require_once 'db.php';

$error = '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $identifier = trim($_POST['identifier']); // Username or Email
    $password = $_POST['password'];

    if (empty($identifier) || empty($password)) {
        $error = "Please fill in all fields.";
    } else {
        // Check if user exists by username or email
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // Password is correct, start session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            
            // Redirect to your game menu
            header("Location: Mainmenu.php");
            exit();
        } else {
            $error = "Invalid username/email or password.";
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
    <!-- Uses the same separate CSS file -->
    <link rel="stylesheet" href="logindesign.css">
</head>
<body>

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

        <!-- Footer Link -->
        <p class="footer-text">
            Don't have an account? <a href="register.php">Register</a>
        </p>
    </div>

</body>
>>>>>>> 34b31a7b8664b5df7dd166804c984880f1465f09
</html>