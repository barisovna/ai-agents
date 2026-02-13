<?php
// Улучшенный API прокси для DeepSeek с полной поддержкой длинных ответов

// КРИТИЧНО: Отключаем вывод ошибок PHP в HTML (они ломают JSON!)
error_reporting(0);
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');

// Начинаем буферизацию вывода для контроля
ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Увеличиваем лимиты PHP для длинных запросов
ini_set('max_execution_time', 300);      // 5 минут
ini_set('memory_limit', '512M');         // 512MB памяти
ini_set('post_max_size', '100M');        // Макс размер POST
ini_set('upload_max_filesize', '100M');  // Макс размер загрузки
set_time_limit(300);                     // 5 минут на скрипт

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Безопасная загрузка config.php
    $configFile = __DIR__ . '/config.php';

    if (!file_exists($configFile)) {
        ob_clean(); // Очищаем буфер перед выводом JSON
        http_response_code(500);
        echo json_encode(['error' => 'Config file not found. Create config.php with deepseek_key']);
        exit();
    }

    $config = require_once($configFile);

    if (!is_array($config) || empty($config['deepseek_key'])) {
        ob_clean(); // Очищаем буфер
        http_response_code(500);
        echo json_encode(['error' => 'API key not configured in config.php']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit();
    }

    // Устанавливаем модель по умолчанию, если не указана
    if (!isset($input['model'])) {
        $input['model'] = 'deepseek-chat';
    }

    // Лимиты токенов для каждой модели (согласно документации DeepSeek)
    $modelLimits = [
        'deepseek-chat' => 8192,      // 8K максимум для chat
        'deepseek-reasoner' => 65536  // 64K максимум для reasoner
    ];

    // Определяем лимит для текущей модели
    $maxLimit = $modelLimits[$input['model']] ?? 8192;

    // Устанавливаем max_tokens с учетом лимита модели
    if (!isset($input['max_tokens'])) {
        // По умолчанию — достаточно для развёрнутого ответа
        $input['max_tokens'] = min(8192, $maxLimit);
    } else {
        // Ограничиваем до лимита модели
        $input['max_tokens'] = min($input['max_tokens'], $maxLimit);
    }

    // Определяем API endpoint (обычный или специальная модель v3.2_speciale)
    $useSpeciale = isset($input['use_speciale']) && $input['use_speciale'] === true;
    $apiUrl = $useSpeciale
        ? 'https://api.deepseek.com/v3.2_speciale_expires_on_20251215/chat/completions'
        : 'https://api.deepseek.com/v1/chat/completions';

    // Для speciale используем deepseek-reasoner (только thinking mode)
    if ($useSpeciale) {
        $input['model'] = 'deepseek-reasoner';
        unset($input['use_speciale']); // Удаляем кастомный параметр
    }

    // Логирование для отладки
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'model' => $input['model'],
        'max_tokens' => $input['max_tokens'],
        'message_count' => count($input['messages'] ?? []),
        'endpoint' => $apiUrl
    ];

    // Логирование включено для отладки (отключите в продакшене)
    file_put_contents(__DIR__ . '/api-debug.log', json_encode($logData) . "\n", FILE_APPEND);

    $ch = curl_init($apiUrl);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($input, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $config['deepseek_key'],
            'Accept: application/json'
        ],
        // ВАЖНО: Увеличенные таймауты для длинных ответов
        CURLOPT_TIMEOUT => 180,           // 3 минуты на выполнение
        CURLOPT_CONNECTTIMEOUT => 15,     // 15 секунд на подключение
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_ENCODING => '',           // Автоматическая декомпрессия
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        // КРИТИЧНО: Используем память вместо временных файлов
        CURLOPT_BUFFERSIZE => 131072,     // Буфер 128KB для длинных ответов
        CURLOPT_NOPROGRESS => true,       // Отключаем прогресс (предотвращает CURL error 23)
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1  // HTTP 1.1
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    $curl_errno = curl_errno($ch);

    curl_close($ch);

    // Детальная обработка ошибок CURL
    if ($curl_errno !== 0) {
        ob_clean();

        // Логируем ошибку
        $errorLog = [
            'timestamp' => date('Y-m-d H:i:s'),
            'error_type' => 'curl_error',
            'curl_errno' => $curl_errno,
            'curl_error' => $curl_error,
            'api_url' => $apiUrl
        ];
        file_put_contents(__DIR__ . '/api-errors.log', json_encode($errorLog) . "\n", FILE_APPEND);

        http_response_code(500);
        echo json_encode([
            'error' => 'Connection error: ' . $curl_error,
            'code' => $curl_errno,
            'suggestion' => 'Проверьте интернет-соединение или firewall'
        ]);
        exit();
    }

    if ($http_code === 200) {
        // Проверяем валидность JSON ответа
        $decoded = json_decode($response, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            ob_clean(); // Очищаем буфер перед успешным ответом
            echo $response;
        } else {
            ob_clean();
            http_response_code(500);
            echo json_encode([
                'error' => 'Invalid response from API',
                'details' => json_last_error_msg()
            ]);
        }
    } else {
        ob_clean();

        // Логируем API ошибку
        $errorLog = [
            'timestamp' => date('Y-m-d H:i:s'),
            'error_type' => 'api_error',
            'http_code' => $http_code,
            'response' => substr($response, 0, 1000)
        ];
        file_put_contents(__DIR__ . '/api-errors.log', json_encode($errorLog) . "\n", FILE_APPEND);

        // Возвращаем ошибку от DeepSeek API
        http_response_code($http_code);
        $errorResponse = json_decode($response, true);

        if ($errorResponse && isset($errorResponse['error'])) {
            echo json_encode([
                'error' => $errorResponse['error']['message'] ?? 'API request failed',
                'type' => $errorResponse['error']['type'] ?? 'unknown',
                'http_code' => $http_code
            ]);
        } else {
            echo json_encode([
                'error' => 'API returned error',
                'http_code' => $http_code,
                'details' => substr($response, 0, 500)
            ]);
        }
    }
    exit();
}

// Если метод не POST
ob_clean();
http_response_code(405);
echo json_encode(['error' => 'Method not allowed. Use POST.']);
?>
