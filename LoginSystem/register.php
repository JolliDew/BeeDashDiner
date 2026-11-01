<<<<<<< HEAD
<?php
session_start();
require_once 'db.php';

$error = '';
$success = '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

    // 1. Basic validation and checks
    if (empty($email) || empty($username) || empty($password) || empty($confirm_password)) {
        $error = "Please fill in all fields.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = "Please enter a valid email address format.";
    } else {
        // Optional: Block disposable email domains
        $domain = substr(strrchr($email, "@"), 1);
        $blocked_domains = ['mailinator.com', 'tempmail.com', '10minutemail.com'];
        
        if (in_array(strtolower($domain), $blocked_domains)) {
            $error = "Disposable or temporary email addresses are not allowed.";
        }
    }

    if (empty($error)) {
        if ($password !== $confirm_password) {
            $error = "Passwords do not match.";
        } else {
            // Check if username or email already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $email]);
            
            if ($stmt->rowCount() > 0) {
                $error = "Username or email is already taken.";
            } else {
                // Hash the password securely
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);

                // Insert new user
                $insertStmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
                if ($insertStmt->execute([$username, $email, $hashed_password])) {
                    
                    // Registration successful: Redirect to login.php instead of Mainmenu.php
                    header("Location: login.php?registered=success");
                    exit();

                } else {
                    $error = "Something went wrong. Please try again.";
                }
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
    <title>Register - JolliDew</title>
    <link rel="stylesheet" href="logindesign.css">
    <style>
        .password-container {
            position: relative;
            display: flex;
            align-items: center;
        }
        .password-container input {
            width: 100%;
            padding-right: 40px;
        }
        .toggle-password {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            cursor: pointer;
            color: #888;
            font-size: 14px;
        }
        .toggle-password:hover {
            color: #333;
        }
    </style>
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
            <h1>Create an Account</h1>
            <p>Please fill in your details.</p>
        </div>

        <?php if (!empty($error)): ?>
            <div class="alert error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <form action="register.php" method="POST">
            <div class="input-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required placeholder="name@example.com" value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
            </div>

            <div class="input-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required placeholder="Choose a unique username" value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>">
            </div>

            <div class="input-group">
                <label for="password">Password</label>
                <div class="password-container">
                    <input type="password" id="password" name="password" required placeholder="••••••••">
                    <button type="button" id="togglePasswordBtn" class="toggle-password" onclick="toggleVisibility('password', 'togglePasswordBtn')">Show</button>
                </div>
            </div>

            <div class="input-group">
                <label for="confirm_password">Confirm Password</label>
                <div class="password-container">
                    <input type="password" id="confirm_password" name="confirm_password" required placeholder="••••••••">
                    <button type="button" id="toggleConfirmBtn" class="toggle-password" onclick="toggleVisibility('confirm_password', 'toggleConfirmBtn')">Show</button>
                </div>
            </div>

            <button type="submit" class="btn-primary">Register</button>
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
            Sign up with Google
        </a>

        <p class="footer-text">
            Already have an account? <a href="login.php">Log in</a>
        </p>
    </div>

<script>
    function toggleVisibility(fieldId, btnId) {
        const inputField = document.getElementById(fieldId);
        const toggleBtn = document.getElementById(btnId);
        
        if (inputField.type === 'password') {
            inputField.type = 'text';
            toggleBtn.textContent = 'Hide';
        } else {
            inputField.type = 'password';
            toggleBtn.textContent = 'Show';
        }
    }
</script>

</body>
=======
<?php
require_once 'db.php';

$error = '';
$success = '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

    if (empty($email) || empty($username) || empty($password) || empty($confirm_password)) {
        $error = "Please fill in all fields.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = "Please enter a valid email address.";
    } elseif ($password !== $confirm_password) {
        $error = "Passwords do not match.";
    } else {
        // Check if username or email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->rowCount() > 0) {
            $error = "Username or email is already taken.";
        } else {
            // Hash the password securely
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);

            // Insert new user with explicit email and username
            $insertStmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
            if ($insertStmt->execute([$username, $email, $hashed_password])) {
                $success = "Registration successful! You can now log in.";
            } else {
                $error = "Something went wrong. Please try again.";
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
    <title>Register - JolliDew</title>
    <link rel="stylesheet" href="logindesign.css">
    <style>
        .password-container {
            position: relative;
            display: flex;
            align-items: center;
        }
        .password-container input {
            width: 100%;
            padding-right: 40px;
        }
        .toggle-password {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            cursor: pointer;
            color: #888;
            font-size: 14px;
        }
        .toggle-password:hover {
            color: #333;
        }
    </style>
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
            <h1>Create an Account</h1>
            <p>Please fill in your details.</p>
        </div>

        <?php if (!empty($error)): ?>
            <div class="alert error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <?php if (!empty($success)): ?>
            <div class="alert success"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>

        <form action="register.php" method="POST">
            <div class="input-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required placeholder="name@example.com">
            </div>

            <div class="input-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required placeholder="Choose a unique username">
            </div>

            <div class="input-group">
                <label for="password">Password</label>
                <div class="password-container">
                    <input type="password" id="password" name="password" required placeholder="••••••••">
                    <button type="button" id="togglePasswordBtn" class="toggle-password" onclick="toggleVisibility('password', 'togglePasswordBtn')">Show</button>
                </div>
            </div>

            <div class="input-group">
                <label for="confirm_password">Confirm Password</label>
                <div class="password-container">
                    <input type="password" id="confirm_password" name="confirm_password" required placeholder="••••••••">
                    <button type="button" id="toggleConfirmBtn" class="toggle-password" onclick="toggleVisibility('confirm_password', 'toggleConfirmBtn')">Show</button>
                </div>
            </div>

            <button type="submit" class="btn-primary">Register</button>
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
            Sign up with Google
        </a>

        <p class="footer-text">
            Already have an account? <a href="login.php">Log in</a>
        </p>
    </div>

<script>
    function toggleVisibility(fieldId, btnId) {
        const inputField = document.getElementById(fieldId);
        const toggleBtn = document.getElementById(btnId);
        
        if (inputField.type === 'password') {
            inputField.type = 'text';
            toggleBtn.textContent = 'Hide';
        } else {
            inputField.type = 'password';
            toggleBtn.textContent = 'Show';
        }
    }
</script>

</body>
>>>>>>> 34b31a7b8664b5df7dd166804c984880f1465f09
</html>