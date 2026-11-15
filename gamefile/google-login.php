<?php
session_start();
require_once 'db.php';

// --- PASTE YOUR FULL CREDENTIALS FROM THE CONSOLE HERE ---
$client_id = '1064096372415-6gkrpovsjdr480dm0293etkcc9jvnqhq.apps.googleusercontent.com';
$client_secret = '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';

// Dynamically match your exact local path
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$redirect_uri = $protocol . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']) . '/google-login.php';

// Step 1: If Google hasn't sent a return code yet, send the user to Google's login prompt
if (!isset($_GET['code'])) {
    $_SESSION['oauth_state'] = bin2hex(random_bytes(16)); // anti-CSRF
    $google_oauth_url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => $client_id,
        'redirect_uri' => $redirect_uri,
        'response_type' => 'code',
        'scope' => 'email profile',
        'state' => $_SESSION['oauth_state'],
    ]);
    header('Location: ' . $google_oauth_url);
    exit();
}

// Step 2: Handle the response callback from Google
if (isset($_GET['code'])) {
    if (!isset($_GET['state'], $_SESSION['oauth_state']) || !hash_equals($_SESSION['oauth_state'], $_GET['state'])) {
        echo "Invalid login state. Please try again.";
        exit();
    }
    unset($_SESSION['oauth_state']);
    
    $token_url = 'https://oauth2.googleapis.com/token';
    $post_data = [
        'code' => $_GET['code'],
        'client_id' => $client_id,
        'client_secret' => $client_secret,
        'redirect_uri' => $redirect_uri,
        'grant_type' => 'authorization_code'
    ];

    $options = [
        'http' => [
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($post_data),
            'ignore_errors' => true
        ],
    ];
    $context = stream_context_create($options);
    $response = @file_get_contents($token_url, false, $context);

    $token_data = $response ? json_decode($response, true) : null;

    if ($token_data && isset($token_data['access_token'])) {
        // Step 3: Fetch the user's Google profile information
        $userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo?access_token=' . $token_data['access_token'];
        $userinfo_response = @file_get_contents($userinfo_url);
        $google_user = $userinfo_response ? json_decode($userinfo_response, true) : null;

        if (empty($google_user['email'])) { echo "Google did not return an email."; exit(); }
        $email = $google_user['email'];
        $username = $google_user['given_name'] ?? explode('@', $email)[0];

        // Step 4: Check if this email already exists in your database
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
            // Existing user: Log them in
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
        } else {
            // New user: Automatically register them with a secure random placeholder password
            $random_password = password_hash(uniqid(), PASSWORD_DEFAULT);
            $insertStmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
            $insertStmt->execute([$username, $email, $random_password]);

            $_SESSION['user_id'] = $pdo->lastInsertId();
            $_SESSION['username'] = $username;
        }

        session_regenerate_id(true);
        
        // Step 5: Redirect straight into your menu page
        header("Location: Mainmenu.php");
        exit();
    } else {
        echo "Authentication failed with Google.<br>";
        echo "<strong>Google Error Response:</strong> " . htmlspecialchars($response ?: 'No response');
        exit();
    }
}
?>