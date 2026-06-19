<?php

// PHP backend — run with: npm run php  (php -S localhost:8001 -t backend)
// Vite proxies /api/* here in dev. In production, configure your web server similarly.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = ltrim($uri, '/');

// ── Helpers ──────────────────────────────────────────────────────────────────

function http_get($url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'rpgordle/1.0',
    ]);
    $body     = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$body, $httpCode];
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/health
if ($uri === 'api/health' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['status' => 'ok']);
    exit;
}

// GET /api/word/random
// Returns a random English word from random-word-api.vercel.app
if ($uri === 'api/word/random' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    [$body, $code] = http_get('https://random-word-api.vercel.app/word');

    if ($body === false || $code !== 200) {
        http_response_code(502);
        echo json_encode(['error' => 'Failed to reach word API']);
        exit;
    }

    $data = json_decode($body, true);
    echo json_encode(['word' => $data[0]]);
    exit;
}

// GET /api/word/validate?word=hello
// Returns { word, valid } using the Free Dictionary API
if ($uri === 'api/word/validate' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $word = trim($_GET['word'] ?? '');

    if ($word === '' || !preg_match('/^[a-zA-Z]+$/', $word)) {
        http_response_code(400);
        echo json_encode(['error' => 'word parameter must be non-empty letters only']);
        exit;
    }

    $word = strtolower($word);
    [, $code] = http_get("https://api.dictionaryapi.dev/api/v2/entries/en/{$word}");

    echo json_encode(['word' => $word, 'valid' => $code === 200]);
    exit;
}

// ── 404 ───────────────────────────────────────────────────────────────────────

http_response_code(404);
echo json_encode(['error' => 'Not found']);
