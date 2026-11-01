<?php
session_start();
require_once 'db.php';

// --- INSERT YOUR GOOGLE CREDENTIALS HERE ---
$client_id = '1064096372415-6gkrpovsjdr480dm0293etkcc9jvnqhq.apps.googleusercontent.com'; //YOUR_CLIENT_ID.apps.googleusercontent.com
$client_secret = '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'; //YOUR_CLIENT_SECRET
$redirect_uri = 'http://localhost/JolliDew/LoginSystem/google-login.php';

// Step 1: If Google hasn't sent a return code yet, send the user to Google's login prompt
if (!isset($_GET['code'])) {
    $google_oauth_url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => $client_id,
        'redirect_uri' => $redirect_uri,
        'response_type' => 'code',
        'scope' => 'email profile',
    ]);
    header('Location: ' . $google_oauth_url);
    exit();
}

// Step 2: Handle the response callback from Google
if (isset($_GET['code'])) {
    $token_url = 'https://oauth2.googleapis.com/token';
    $post_data = [
        'code' => $_GET['code'],
        'client_id' => $client_id,
        'client_secret' => $client_secret,
        'redirect_uri' => $redirect_uri,
        'grant_type' => 'authorization_code'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $token_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    $token_data = json_decode($response, true);

    if (isset($token_data['access_token'])) {
        // Step 3: Fetch the user's Google profile information
        $userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo?access_token=' . $token_data['access_token'];
        $userinfo_response = file_get_contents($userinfo_url);
        $google_user = json_decode($userinfo_response, true);

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

        // Step 5: Redirect straight into your game menu
        header("Location: ../Mainmenu/Mainmenu.php");
        exit();
    } else {
        echo "Authentication failed with Google.";
        exit();
    }
}
?>