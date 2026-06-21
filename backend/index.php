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

// GET /api/word/random?pos=n
// Returns a random English word with full Datamuse metadata, optionally filtered by part of speech.
// pos values: n (noun), v (verb), adj (adjective), adv (adverb)
if ($uri === 'api/word/random' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $allowed_pos = ['n', 'v', 'adj', 'adv'];
    $pos     = $_GET['pos'] ?? '';
    if (!in_array($pos, $allowed_pos)) $pos = '';

    $length  = rand(4, 8);
    $pattern = str_repeat('?', $length);

    // md=d (definitions) p (parts of speech) f (frequency) s (syllables)
    // max=200: results are frequency-ordered so the bottom of a larger list would only be rare words
    $url = "https://api.datamuse.com/words?sp={$pattern}&max=200&md=dpfs";
    [$body, $code, $curlErr] = http_get($url);

    if ($body === false || $code !== 200) {
        http_response_code(502);
        echo json_encode(['error' => 'Failed to reach Datamuse API', 'detail' => $curlErr ?: "HTTP $code"]);
        exit;
    }

    $words = json_decode($body, true);
    if (!is_array($words) || count($words) === 0) {
        http_response_code(502);
        echo json_encode(['error' => 'No words returned from Datamuse']);
        exit;
    }

    // Always filter to words with frequency >= 0.1 per million (excludes obscure words)
    $words = array_values(array_filter($words, function($w) {
        foreach ($w['tags'] ?? [] as $tag) {
            if (str_starts_with($tag, 'f:') && (float) substr($tag, 2) >= 0.1) return true;
        }
        return false;
    }));

    if ($pos !== '') {
        $words = array_values(array_filter($words, fn($w) => in_array($pos, $w['tags'] ?? [])));
    }

    if (count($words) === 0) {
        http_response_code(502);
        echo json_encode(['error' => 'No words found matching the selected filters']);
        exit;
    }

    echo json_encode($words[array_rand($words)]);
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
