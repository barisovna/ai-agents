<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест DeepSeek API</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .result {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .success { border-color: #10b981; }
        .error { border-color: #ef4444; }
        .warning { border-color: #f59e0b; }
        pre {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        h1 { color: #333; }
        h2 { color: #667eea; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>🧪 Тест DeepSeek API</h1>

    <?php
    // Проверка конфигурации
    echo "<h2>1. Проверка config.php</h2>";

    $configFile = __DIR__ . '/config.php';
    if (!file_exists($configFile)) {
        echo '<div class="result error"><strong>❌ Ошибка:</strong> Файл config.php не найден!</div>';
        echo '<p>Создайте файл config.php с вашим API ключом.</p>';
        exit();
    }

    $config = require_once($configFile);

    if (!is_array($config) || empty($config['deepseek_key'])) {
        echo '<div class="result error"><strong>❌ Ошибка:</strong> API ключ не настроен в config.php</div>';
        exit();
    }

    $apiKey = $config['deepseek_key'];
    $keyPreview = substr($apiKey, 0, 7) . '...' . substr($apiKey, -4);
    echo "<div class='result success'><strong>✅ Ключ найден:</strong> $keyPreview</div>";

    // Проверка PHP конфигурации
    echo "<h2>2. Проверка PHP</h2>";
    echo "<div class='result'>";
    echo "<strong>PHP версия:</strong> " . phpversion() . "<br>";
    echo "<strong>CURL:</strong> " . (extension_loaded('curl') ? '✅ Включен' : '❌ Отключен') . "<br>";
    echo "<strong>OpenSSL:</strong> " . (extension_loaded('openssl') ? '✅ Включен' : '❌ Отключен') . "<br>";
    echo "<strong>JSON:</strong> " . (extension_loaded('json') ? '✅ Включен' : '❌ Отключен') . "<br>";
    echo "<strong>Max execution time:</strong> " . ini_get('max_execution_time') . " сек<br>";
    echo "<strong>Memory limit:</strong> " . ini_get('memory_limit') . "<br>";
    echo "</div>";

    if (!extension_loaded('curl')) {
        echo '<div class="result error"><strong>❌ Критическая ошибка:</strong> CURL не установлен!</div>';
        exit();
    }

    // Тест подключения к API
    echo "<h2>3. Тест подключения к DeepSeek API</h2>";

    $testMessage = [
        'model' => 'deepseek-chat',
        'messages' => [
            ['role' => 'user', 'content' => 'Привет! Это тестовое сообщение.']
        ],
        'max_tokens' => 100,
        'temperature' => 0.7
    ];

    $ch = curl_init('https://api.deepseek.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($testMessage),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true
    ]);

    echo "<div class='result'>";
    echo "<strong>🔄 Отправка тестового запроса...</strong><br>";
    echo "Endpoint: https://api.deepseek.com/v1/chat/completions<br>";
    echo "Model: deepseek-chat<br>";
    echo "Max tokens: 100<br>";
    echo "</div>";

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);
    curl_close($ch);

    // Результаты
    echo "<h2>4. Результаты</h2>";

    if ($curlErrno !== 0) {
        echo "<div class='result error'>";
        echo "<strong>❌ CURL Ошибка:</strong><br>";
        echo "Code: $curlErrno<br>";
        echo "Message: $curlError<br>";
        echo "</div>";

        echo "<div class='result warning'>";
        echo "<strong>💡 Возможные причины:</strong><br>";
        echo "• Проблемы с интернет-соединением<br>";
        echo "• Файрвол блокирует исходящие запросы<br>";
        echo "• SSL сертификаты не настроены<br>";
        echo "• Хостинг блокирует доступ к внешним API<br>";
        echo "</div>";
        exit();
    }

    echo "<div class='result'>";
    echo "<strong>HTTP Status Code:</strong> $httpCode<br>";
    echo "</div>";

    if ($httpCode === 200) {
        $data = json_decode($response, true);

        echo "<div class='result success'>";
        echo "<strong>✅ Успешно! API работает!</strong><br><br>";

        if (isset($data['choices'][0]['message']['content'])) {
            $aiResponse = $data['choices'][0]['message']['content'];
            echo "<strong>Ответ от AI:</strong><br>";
            echo htmlspecialchars($aiResponse);
        }

        echo "<br><br><strong>Использование токенов:</strong><br>";
        if (isset($data['usage'])) {
            echo "• Input: " . $data['usage']['prompt_tokens'] . " токенов<br>";
            echo "• Output: " . $data['usage']['completion_tokens'] . " токенов<br>";
            echo "• Всего: " . $data['usage']['total_tokens'] . " токенов<br>";
        }

        echo "</div>";

        echo "<div class='result success'>";
        echo "<strong>🎉 Все проверки пройдены!</strong><br>";
        echo "Ваш маркетинговый ассистент готов к работе.";
        echo "</div>";

    } else {
        $errorData = json_decode($response, true);

        echo "<div class='result error'>";
        echo "<strong>❌ API вернул ошибку:</strong><br><br>";

        if (isset($errorData['error'])) {
            echo "<strong>Тип:</strong> " . ($errorData['error']['type'] ?? 'unknown') . "<br>";
            echo "<strong>Сообщение:</strong> " . ($errorData['error']['message'] ?? 'Unknown error') . "<br>";
        } else {
            echo "<strong>Raw Response:</strong><br>";
            echo "<pre>" . htmlspecialchars(substr($response, 0, 500)) . "</pre>";
        }

        echo "</div>";

        echo "<div class='result warning'>";
        echo "<strong>💡 Возможные проблемы:</strong><br>";
        if ($httpCode === 401) {
            echo "• <strong>Неверный API ключ</strong> - проверьте config.php<br>";
        } elseif ($httpCode === 429) {
            echo "• <strong>Превышен лимит запросов</strong> - подождите<br>";
        } elseif ($httpCode === 500) {
            echo "• <strong>Ошибка сервера DeepSeek</strong> - попробуйте позже<br>";
        } else {
            echo "• Проверьте формат API ключа<br>";
            echo "• Убедитесь что ключ активен на platform.deepseek.com<br>";
        }
        echo "</div>";
    }
    ?>

    <h2>5. Полный ответ API (для отладки)</h2>
    <details>
        <summary style="cursor: pointer; padding: 10px; background: #f0f0f0; border-radius: 5px;">
            Показать JSON ответ
        </summary>
        <pre><?php echo htmlspecialchars(json_encode(json_decode($response, true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); ?></pre>
    </details>

    <div style="margin-top: 40px; padding: 20px; background: #e3f2fd; border-radius: 10px;">
        <strong>📚 Документация:</strong><br>
        • <a href="https://api-docs.deepseek.com/" target="_blank">DeepSeek API Docs</a><br>
        • <a href="https://platform.deepseek.com/api_keys" target="_blank">Управление ключами</a><br>
        • <a href="README-SETUP.md">README-SETUP.md</a> - инструкция по настройке
    </div>
</body>
</html>
