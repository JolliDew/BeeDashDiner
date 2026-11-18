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
require_once 'db.php';
require_once 'src/Auth.php';
Auth::start();

$configPath = __DIR__ . '/src/google-config.php';
if (!is_file($configPath)) {
    $configPath = __DIR__ . '/src/google-config.example.php';
}
$google = require $configPath;

$client_id = trim((string)($google['client_id'] ?? ''));
$client_secret = trim((string)($google['client_secret'] ?? ''));
$configured_redirect = trim((string)($google['redirect_uri'] ?? ''));

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

// Prefer the exact URI registered in Google Cloud Console. When it is omitted,
// build it from the current request (handy for `php -S` and XAMPP demos).
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
$redirect_uri = $configured_redirect !== ''
    ? $configured_redirect
    : $scheme . '://' . $host . $dir . '/google-login.php';

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
$email = filter_var(strtolower((string)($googleUser['email'] ?? '')), FILTER_VALIDATE_EMAIL);
if (!$email) {
    google_login_error('Google did not return a usable email address.');
}

// v2 userinfo calls it verified_email; the OIDC userinfo endpoint calls it
// email_verified. Accept either, but never trust an unverified address.
$verified = $googleUser['email_verified'] ?? $googleUser['verified_email'] ?? false;
if ($verified !== true && $verified !== 'true' && $verified !== 1 && $verified !== '1') {
    google_login_error('Google has not verified this email address.');
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    Auth::login($user);
} else {
    $base = preg_replace('/[^A-Za-z0-9_]/', '', $googleUser['given_name'] ?? '');
    $base = substr($base !== '' ? $base : strstr($email, '@', true), 0, 40) ?: 'player';

    $exists = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $insert = $pdo->prepare('INSERT INTO users (username, email, password, auth_provider, password_set) VALUES (?, ?, ?, \'google\', 0)');
    $username = $base;
    $created = false;

    for ($attempt = 0; $attempt < 6; $attempt++) {
        $username = $attempt === 0 ? $base : $base . random_int(2, 9999);
        $exists->execute([$username]);
        if ($exists->fetch()) {
            continue;
        }
        try {
            $insert->execute([
                $username,
                $email,
                password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT),
            ]);
            $created = true;
            break;
        } catch (PDOException $e) {
            // Someone may have registered the same email at the same time.
            // If so, log into that account instead of showing an SQL error.
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            if ($user) {
                break;
            }
        }
    }

    if ($user) {
        Auth::login($user);
    } elseif ($created) {
        $user = [
            'id' => (int)$pdo->lastInsertId(),
            'username' => $username,
            'role' => 'player',
        ];
        Auth::login($user);
    } else {
        google_login_error('Could not create an account with that email. Please try again.');
    }
}

header('Location: Mainmenu.php');
exit();
