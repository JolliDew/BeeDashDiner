<?php
/**
 * Promote an existing account to admin from the command line.
 *
 *   php gamefile/bin/make-admin.php <username>
 *
 * Register the account in the browser first, then run this once. The script
 * refuses to run from a web request so a public URL cannot create admins.
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}

$username = trim((string)($argv[1] ?? ''));
if ($username === '') {
    fwrite(STDERR, "Usage: php gamefile/bin/make-admin.php <username>\n");
    exit(2);
}

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../src/AdminRepository.php';

$q = $pdo->prepare('SELECT id, username, role FROM users WHERE username = ?');
$q->execute([$username]);
$user = $q->fetch();
if (!$user) {
    fwrite(STDERR, "No account named '{$username}'. Register it in the browser first.\n");
    exit(1);
}

if ($user['role'] === 'admin') {
    echo "{$username} is already an admin.\n";
    exit(0);
}

$pdo->prepare("UPDATE users SET role = 'admin' WHERE id = ?")->execute([$user['id']]);

try {
    $repo = new AdminRepository($pdo);
    $repo->audit(null, 'user.promote', (int)$user['id'], 'First admin promoted from CLI');
} catch (Throwable $e) {
    fwrite(STDERR, "Promoted the account, but could not write the audit row. Run the admin migration.\n");
}

echo "Promoted {$username} (user #{$user['id']}) to admin.\n";
echo "Open admin.php from the main menu.\n";
