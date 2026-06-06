<?php
error_reporting(0);
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');

ini_set('max_execution_time', 300);
ini_set('memory_limit', '512M');
ini_set('post_max_size', '100M');
set_time_limit(300);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit();
}

// Read input BEFORE ob_start so we can detect stream mode early
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit();
}

// Detect streaming mode from client request
$wantStream = !empty($input['stream']) && $input['stream'] === true;

if ($wantStream) {
    // SSE: disable all output buffering
    while (ob_get_level() > 0) ob_end_clean();
    ob_implicit_flush(true);
    header('Content-Type: text/event-stream; charset=utf-8');
    header('Cache-Control: no-cache');
    header('X-Accel-Buffering: no'); // Disable nginx proxy buffering
} else {
    // Non-streaming: buffer output for clean JSON delivery
    ob_start();
    header('Content-Type: application/json; charset=utf-8');
}

// Load config
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    if ($wantStream) {
        echo "data: " . json_encode(['error' => 'Config file not found. Create config.php with deepseek_key']) . "\n\n";
        flush();
    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode(['error' => 'Config file not found. Create config.php with deepseek_key']);
    }
    exit();
}

$config = require_once($configFile);

if (!is_array($config) || empty($config['deepseek_key'])) {
    if ($wantStream) {
        echo "data: " . json_encode(['error' => 'API key not configured in config.php']) . "\n\n";
        flush();
    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode(['error' => 'API key not configured in config.php']);
    }
    exit();
}

// Set default model
if (!isset($input['model'])) {
    $input['model'] = 'deepseek-chat';
}

// Token limits per model
$modelLimits = [
    'deepseek-chat'     => 8192,
    'deepseek-reasoner' => 65536
];
$maxLimit = $modelLimits[$input['model']] ?? 8192;

if (!isset($input['max_tokens'])) {
    $input['max_tokens'] = min(8192, $maxLimit);
} else {
    $input['max_tokens'] = min($input['max_tokens'], $maxLimit);
}

// API endpoint
$useSpeciale = isset($input['use_speciale']) && $input['use_speciale'] === true;
$apiUrl = $useSpeciale
    ? 'https://api.deepseek.com/v3.2_speciale_expires_on_20251215/chat/completions'
    : 'https://api.deepseek.com/v1/chat/completions';

if ($useSpeciale) {
    $input['model'] = 'deepseek-reasoner';
    unset($input['use_speciale']);
}

// Log request (disable in production by removing this block)
$logData = [
    'timestamp'     => date('Y-m-d H:i:s'),
    'model'         => $input['model'],
    'max_tokens'    => $input['max_tokens'],
    'stream'        => $wantStream,
    'message_count' => count($input['messages'] ?? []),
    'endpoint'      => $apiUrl
];
file_put_contents(__DIR__ . '/api-debug.log', json_encode($logData) . "\n", FILE_APPEND);

$httpHeaders = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $config['deepseek_key'],
    'Accept: application/json'
];

$curlBase = [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($input, JSON_UNESCAPED_UNICODE),
    CURLOPT_HTTPHEADER     => $httpHeaders,
    CURLOPT_TIMEOUT        => 180,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_ENCODING       => '',
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 3,
    CURLOPT_NOPROGRESS     => true,
    CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1
];

// ── STREAMING PATH ──────────────────────────────────────────────────────────
if ($wantStream) {
    $input['stream'] = true; // Ensure DeepSeek also streams

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, array_merge($curlBase, [
        CURLOPT_POSTFIELDS     => json_encode($input, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => false, // Do not buffer — write directly
        CURLOPT_WRITEFUNCTION  => function ($ch, $data) {
            // DeepSeek already sends SSE-formatted lines — forward them as-is
            echo $data;
            flush();
            return strlen($data);
        }
    ]));

    curl_exec($ch);
    $curl_errno = curl_errno($ch);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_errno !== 0) {
        $errorLog = [
            'timestamp'  => date('Y-m-d H:i:s'),
            'error_type' => 'curl_error',
            'curl_errno' => $curl_errno,
            'curl_error' => $curl_error
        ];
        file_put_contents(__DIR__ . '/api-errors.log', json_encode($errorLog) . "\n", FILE_APPEND);
        echo "data: " . json_encode(['error' => 'Connection error: ' . $curl_error]) . "\n\n";
        flush();
    }

    exit();
}

// ── NON-STREAMING PATH (fallback) ───────────────────────────────────────────
// Remove stream key if present so DeepSeek returns a complete response
unset($input['stream']);

$ch = curl_init($apiUrl);
curl_setopt_array($ch, array_merge($curlBase, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_BUFFERSIZE     => 131072
]));

$response  = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_errno = curl_errno($ch);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_errno !== 0) {
    ob_clean();
    $errorLog = [
        'timestamp'  => date('Y-m-d H:i:s'),
        'error_type' => 'curl_error',
        'curl_errno' => $curl_errno,
        'curl_error' => $curl_error,
        'api_url'    => $apiUrl
    ];
    file_put_contents(__DIR__ . '/api-errors.log', json_encode($errorLog) . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'error'      => 'Connection error: ' . $curl_error,
        'code'       => $curl_errno,
        'suggestion' => 'Проверьте интернет-соединение или firewall'
    ]);
    exit();
}

if ($http_code === 200) {
    $decoded = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        ob_clean();
        echo $response;
    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'error'   => 'Invalid response from API',
            'details' => json_last_error_msg()
        ]);
    }
} else {
    ob_clean();
    $errorLog = [
        'timestamp'  => date('Y-m-d H:i:s'),
        'error_type' => 'api_error',
        'http_code'  => $http_code,
        'response'   => substr($response, 0, 1000)
    ];
    file_put_contents(__DIR__ . '/api-errors.log', json_encode($errorLog) . "\n", FILE_APPEND);

    http_response_code($http_code);
    $errorResponse = json_decode($response, true);
    if ($errorResponse && isset($errorResponse['error'])) {
        echo json_encode([
            'error'     => $errorResponse['error']['message'] ?? 'API request failed',
            'type'      => $errorResponse['error']['type'] ?? 'unknown',
            'http_code' => $http_code
        ]);
    } else {
        echo json_encode([
            'error'     => 'API returned error',
            'http_code' => $http_code,
            'details'   => substr($response, 0, 500)
        ]);
    }
}
exit();
?>
