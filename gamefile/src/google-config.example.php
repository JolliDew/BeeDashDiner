<?php
/**
 * Google OAuth credentials template.
 *
 *   cp gamefile/src/google-config.example.php gamefile/src/google-config.php
 *
 * Then paste your own values from Google Cloud Console > Credentials.
 * google-config.php is ignored by git, so real secrets never get committed.
 *
 * The redirect URI must be registered in Google Cloud Console. For the
 * built-in PHP server it is usually:
 *   http://127.0.0.1:8000/google-login.php
 * For XAMPP it is usually:
 *   http://localhost/gamefile/google-login.php
 */
return [
    'client_id'     => 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    'client_secret' => 'YOUR_CLIENT_SECRET',
];
