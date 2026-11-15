<?php
require_once __DIR__ . '/db.php'; // official database connection ($pdo)
require_once __DIR__ . '/src/Auth.php';
require_once __DIR__ . '/src/SaveRepository.php';
require_once __DIR__ . '/src/ApiController.php';

header('Content-Type: application/json');
(new ApiController(new SaveRepository($pdo)))->handle();
