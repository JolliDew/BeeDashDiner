<?php
/**
 * Google OAuth credentials template.
 *
 *   cp gamefile/src/google-config.example.php gamefile/src/google-config.php
 *
 * Then paste your own values from Google Cloud Console > Credentials.
 * google-config.php is ignored by git, so real secrets never get committed.
 *
 * Register the exact redirect URI(s) used by the demo in Google Cloud Console:
 *   built-in server: http://127.0.0.1:8000/google-login.php
 *   XAMPP:           http://localhost/JolliDew/gamefile/google-login.php
 *
 * `redirect_uri` is optional. Set it when the automatic value does not match
 * Google's registered URI (for example, behind a proxy or a custom domain).
 * The value must match Google exactly, including http/https and trailing slash.
 */
return [
    'client_id'     => 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    'client_secret' => 'YOUR_CLIENT_SECRET',
    // 'redirect_uri' => 'http://127.0.0.1:8000/google-login.php',
];
