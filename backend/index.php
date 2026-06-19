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
    if (!function_exists('curl_init')) {
        return [false, 0, 'curl extension is not enabled in PHP'];
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT      => 'rpgordle/1.0',
    ]);
    $body     = curl_exec($ch);
    $curlErr  = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$body, $httpCode, $curlErr];
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/health
if ($uri === 'api/health' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['status' => 'ok']);
    exit;
}

// GET /api/word/categories
// Returns the list of available word categories
if ($uri === 'api/word/categories' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        ['value' => 'all',                   'label' => 'All Categories'],
        ['value' => 'wordle',                'label' => 'Wordle'],
        ['value' => 'brainrot',              'label' => 'Brainrot'],
        ['value' => 'countries',             'label' => 'Countries'],
        ['value' => 'capitals_of_countries', 'label' => 'Capitals of Countries'],
        ['value' => 'sports',                'label' => 'Sports'],
        ['value' => 'animals',               'label' => 'Animals'],
        ['value' => 'birds',                 'label' => 'Birds'],
        ['value' => 'softwares',             'label' => 'Software'],
        ['value' => 'programming_languages', 'label' => 'Programming Languages'],
        ['value' => 'games',                 'label' => 'Games (All)'],
        ['value' => 'pc_games',              'label' => 'Games (PC)'],
        ['value' => 'mobile_games',          'label' => 'Games (Mobile)'],
        ['value' => 'console_games',         'label' => 'Games (Console)'],
        ['value' => 'companies',             'label' => 'Companies'],
    ]);
    exit;
}

// GET /api/word/random?category=animals
// Returns a random English word, optionally filtered by category
if ($uri === 'api/word/random' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $category = $_GET['category'] ?? 'all';
    if (!preg_match('/^[a-z_]+$/', $category)) $category = 'all';

    $url = "https://random-words-api.kushcreates.com/api?language=en&words=1&category={$category}";
    [$body, $code, $curlErr] = http_get($url);

    if ($body === false || $code !== 200) {
        http_response_code(502);
        echo json_encode([
            'error'    => 'Failed to reach word API',
            'detail'   => $curlErr ?: "HTTP $code",
        ]);
        exit;
    }

    $data = json_decode($body, true);

    // Normalise across response shapes: ["word"], {"word":"..."}, or plain string
    if (is_array($data) && isset($data[0])) {
        $word = $data[0];
    } elseif (is_array($data) && isset($data['word'])) {
        $word = $data['word'];
    } elseif (is_string($data)) {
        $word = $data;
    } else {
        http_response_code(502);
        echo json_encode(['error' => 'Unexpected API response', 'raw' => $body]);
        exit;
    }

    echo json_encode(['word' => $word]);
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
    // 200 = valid word, 404 = not found, anything else = treat as invalid

    echo json_encode(['word' => $word, 'valid' => $code === 200]);
    exit;
}

// ── 404 ───────────────────────────────────────────────────────────────────────

http_response_code(404);
echo json_encode(['error' => 'Not found']);
