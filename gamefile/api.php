<?php
require_once __DIR__ . '/db.php'; // official database connection ($pdo)
require_once __DIR__ . '/src/Auth.php';
require_once __DIR__ . '/src/SaveRepository.php';
require_once __DIR__ . '/src/ApiController.php';

header('Content-Type: application/json');

// A deleted account must lose API access immediately, even if its old session
// file still exists on the server.
$user = Auth::refresh($pdo);
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'not logged in']);
    exit();
}

(new ApiController(new SaveRepository($pdo)))->handle();
