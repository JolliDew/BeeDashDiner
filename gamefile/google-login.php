<?php
/**
 * Optional Google sign-in.
 *
 * Setup:
 *   1. cp gamefile/src/google-config.example.php gamefile/src/google-config.php
 *   2. Fill in the client id/secret from Google Cloud Console.
 *   3. Add the redirect URI shown by this file to the OAuth client.
 *
 * If the config still has placeholder values the page explains what is missing
 * instead of redirecting to Google with an invalid client id.
 */
session_start();
require_once 'db.php';

$configPath = __DIR__ . '/src/google-config.php';
if (!is_file($configPath)) {
    $configPath = __DIR__ . '/src/google-config.example.php';
}
$google = require $configPath;

$client_id = trim((string)($google['client_id'] ?? ''));
$client_secret = trim((string)($google['client_secret'] ?? ''));

function google_login_error(string $message, int $code = 400): void
{
    http_response_code($code);
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<title>Google sign-in - JolliDew</title>'
        . '<style>body{font-family:system-ui,sans-serif;background:#1f160b;color:#fff6df;'
        . 'display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}'
        . 'main{max-width:520px;background:#33291a;border-radius:16px;padding:24px}'
        . 'a{color:#ffd84d}</style></head><body><main><h1>Google sign-in</h1><p>'
        . htmlspecialchars($message)
        . '</p><p><a href="login.php">Back to login</a></p></main></body></html>';
    exit();
}

if (str_starts_with($client_id, 'YOUR_') || str_starts_with($client_secret, 'YOUR_')) {
    google_login_error(
        'Google sign-in is not configured yet. Copy src/google-config.example.php to '
        . 'src/google-config.php and add your Google Cloud credentials.',
        503
    );
}

// Build the redirect URI from the current request so it works with both
// `php -S` and XAMPP without hard-coding a port.
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
$redirect_uri = $scheme . '://' . $host . $dir . '/google-login.php';

if (!isset($_GET['code'])) {
    $_SESSION['oauth_state'] = bin2hex(random_bytes(16));
    $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id'     => $client_id,
        'redirect_uri'  => $redirect_uri,
        'response_type' => 'code',
        'scope'         => 'email profile',
        'state'         => $_SESSION['oauth_state'],
        'prompt'        => 'select_account',
    ]);
    header('Location: ' . $authUrl);
    exit();
}

// Step 2: Google sent us back with a code. Verify state, then exchange it.
if (!isset($_GET['state'], $_SESSION['oauth_state']) || !hash_equals($_SESSION['oauth_state'], $_GET['state'])) {
    google_login_error('Invalid login state. Please try again.');
}
unset($_SESSION['oauth_state']);

$postData = [
    'code'          => $_GET['code'],
    'client_id'     => $client_id,
    'client_secret' => $client_secret,
    'redirect_uri'  => $redirect_uri,
    'grant_type'    => 'authorization_code',
];

$ch = curl_init('https://oauth2.googleapis.com/token');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query($postData),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
]);
$response = curl_exec($ch);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    google_login_error('Could not reach Google: ' . $curlError, 502);
}

$tokenData = json_decode($response, true);
if (empty($tokenData['access_token'])) {
    google_login_error('Google did not return an access token. Check the client id, secret and redirect URI.');
}

$ch = curl_init('https://www.googleapis.com/oauth2/v2/userinfo');
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $tokenData['access_token']],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
]);
$userInfo = curl_exec($ch);
$curlError = curl_error($ch);
curl_close($ch);

if ($userInfo === false) {
    google_login_error('Could not read your Google profile: ' . $curlError, 502);
}

$googleUser = json_decode($userInfo, true);
$email = filter_var($googleUser['email'] ?? '', FILTER_VALIDATE_EMAIL);
if (!$email) {
    google_login_error('Google did not return a usable email address.');
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['username'] = $user['username'];
} else {
    $base = preg_replace('/[^A-Za-z0-9_]/', '', $googleUser['given_name'] ?? '');
    $base = substr($base !== '' ? $base : strstr($email, '@', true), 0, 40) ?: 'player';
    $username = $base;

    $exists = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    for ($i = 2; ; $i++) {
        $exists->execute([$username]);
        if (!$exists->fetch()) {
            break;
        }
        $username = $base . $i;
    }

    $insert = $pdo->prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    $insert->execute([
        $username,
        $email,
        password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT),
    ]);

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$pdo->lastInsertId();
    $_SESSION['username'] = $username;
}

header('Location: Mainmenu.php');
exit();
