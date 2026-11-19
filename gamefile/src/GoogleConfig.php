<?php
/**
 * Google OAuth settings for local XAMPP and Render.
 *
 * Local:   gamefile/src/google-config.php (ignored by git).
 * Render:  GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (+ optional
 *          GOOGLE_REDIRECT_URI) environment variables.
 *
 * Environment variables win so a deployment can override a stale local file,
 * but the file keeps the simple XAMPP setup working without any environment
 * configuration.
 */
class GoogleConfig
{
    public static function load(): array
    {
        $envId = trim((string)(getenv('GOOGLE_CLIENT_ID') ?: ''));
        $envSecret = trim((string)(getenv('GOOGLE_CLIENT_SECRET') ?: ''));
        $envRedirect = trim((string)(getenv('GOOGLE_REDIRECT_URI') ?: ''));

        if ($envId !== '' && $envSecret !== '') {
            return [
                'client_id' => $envId,
                'client_secret' => $envSecret,
                'redirect_uri' => $envRedirect,
            ];
        }

        $file = __DIR__ . '/google-config.php';
        if (is_file($file)) {
            $config = require $file;
            if (is_array($config)) {
                return $config + ['redirect_uri' => ''];
            }
        }

        return ['client_id' => '', 'client_secret' => '', 'redirect_uri' => ''];
    }

    /** True only when a usable client id and secret are present. */
    public static function available(): bool
    {
        $config = self::load();
        $id = trim((string)($config['client_id'] ?? ''));
        $secret = trim((string)($config['client_secret'] ?? ''));

        return $id !== '' && $secret !== ''
            && !str_starts_with($id, 'YOUR_')
            && !str_starts_with($secret, 'YOUR_');
    }
}
