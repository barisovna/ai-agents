<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Проверка лимитов PHP</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 { color: #667eea; }
        .result {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
        }
        .good { border-color: #10b981; }
        .warning { border-color: #f59e0b; }
        .bad { border-color: #ef4444; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #667eea;
            color: white;
        }
        .status {
            padding: 4px 12px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 12px;
        }
        .status.good { background: #10b981; color: white; }
        .status.warning { background: #f59e0b; color: white; }
        .status.bad { background: #ef4444; color: white; }
    </style>
</head>
<body>
    <h1>🔍 Проверка лимитов PHP</h1>

    <?php
    // Функция для проверки значения
    function checkLimit($current, $required, $unit = '') {
        $currentVal = $current;
        $requiredVal = $required;

        // Конвертация в байты если есть M, G
        if (strpos($current, 'M') !== false) {
            $currentVal = (int)$current * 1024 * 1024;
        } elseif (strpos($current, 'G') !== false) {
            $currentVal = (int)$current * 1024 * 1024 * 1024;
        }

        if (strpos($required, 'M') !== false) {
            $requiredVal = (int)$required * 1024 * 1024;
        } elseif (strpos($required, 'G') !== false) {
            $requiredVal = (int)$required * 1024 * 1024 * 1024;
        }

        if ($currentVal >= $requiredVal) {
            return ['status' => 'good', 'class' => 'good', 'text' => '✅ OK'];
        } elseif ($currentVal >= $requiredVal * 0.7) {
            return ['status' => 'warning', 'class' => 'warning', 'text' => '⚠️ Мало'];
        } else {
            return ['status' => 'bad', 'class' => 'bad', 'text' => '❌ Недостаточно'];
        }
    }

    // Получаем текущие значения
    $limits = [
        'memory_limit' => [
            'current' => ini_get('memory_limit'),
            'required' => '512M',
            'description' => 'Лимит памяти'
        ],
        'max_execution_time' => [
            'current' => ini_get('max_execution_time'),
            'required' => '300',
            'description' => 'Время выполнения (сек)'
        ],
        'post_max_size' => [
            'current' => ini_get('post_max_size'),
            'required' => '50M',
            'description' => 'Макс размер POST'
        ],
        'upload_max_filesize' => [
            'current' => ini_get('upload_max_filesize'),
            'required' => '50M',
            'description' => 'Макс размер загрузки'
        ],
        'max_input_time' => [
            'current' => ini_get('max_input_time'),
            'required' => '300',
            'description' => 'Время получения данных (сек)'
        ]
    ];

    // Подсчитываем статистику
    $totalChecks = count($limits);
    $goodChecks = 0;
    $warningChecks = 0;
    $badChecks = 0;

    foreach ($limits as $key => $data) {
        $check = checkLimit($data['current'], $data['required']);
        if ($check['status'] === 'good') $goodChecks++;
        elseif ($check['status'] === 'warning') $warningChecks++;
        else $badChecks++;
    }

    // Общий статус
    if ($badChecks === 0 && $warningChecks === 0) {
        $overallClass = 'good';
        $overallText = '✅ Все лимиты настроены правильно!';
    } elseif ($badChecks > 0) {
        $overallClass = 'bad';
        $overallText = '❌ Есть критические проблемы! Нужно увеличить лимиты.';
    } else {
        $overallClass = 'warning';
        $overallText = '⚠️ Рекомендуется увеличить некоторые лимиты.';
    }
    ?>

    <div class="result <?php echo $overallClass; ?>">
        <h2><?php echo $overallText; ?></h2>
        <p>Проверено: <?php echo $totalChecks; ?> параметров</p>
        <p>
            ✅ OK: <?php echo $goodChecks; ?> |
            ⚠️ Предупреждений: <?php echo $warningChecks; ?> |
            ❌ Проблем: <?php echo $badChecks; ?>
        </p>
    </div>

    <div class="result">
        <h2>📊 Детальная информация</h2>
        <table>
            <thead>
                <tr>
                    <th>Параметр</th>
                    <th>Текущее значение</th>
                    <th>Требуется</th>
                    <th>Статус</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($limits as $key => $data):
                    $check = checkLimit($data['current'], $data['required']);
                ?>
                <tr>
                    <td><strong><?php echo $data['description']; ?></strong><br>
                        <small style="color: #666;"><?php echo $key; ?></small>
                    </td>
                    <td><?php echo $data['current']; ?></td>
                    <td><?php echo $data['required']; ?></td>
                    <td><span class="status <?php echo $check['class']; ?>"><?php echo $check['text']; ?></span></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <div class="result">
        <h2>🔧 PHP Информация</h2>
        <p><strong>PHP Версия:</strong> <?php echo phpversion(); ?></p>
        <p><strong>CURL:</strong> <?php echo extension_loaded('curl') ? '✅ Включен' : '❌ Отключен'; ?></p>
        <p><strong>OpenSSL:</strong> <?php echo extension_loaded('openssl') ? '✅ Включен' : '❌ Отключен'; ?></p>
        <p><strong>JSON:</strong> <?php echo extension_loaded('json') ? '✅ Включен' : '❌ Отключен'; ?></p>
        <p><strong>Временная директория:</strong> <?php echo sys_get_temp_dir(); ?></p>
        <p><strong>Свободно места:</strong> <?php echo round(disk_free_space(sys_get_temp_dir()) / 1024 / 1024 / 1024, 2); ?> GB</p>
    </div>

    <?php if ($badChecks > 0 || $warningChecks > 0): ?>
    <div class="result warning">
        <h2>💡 Как исправить?</h2>

        <h3>Способ 1: Использовать .htaccess</h3>
        <p>Загрузите файл <code>.htaccess</code> в ту же папку, что и этот файл.</p>
        <pre style="background: #f0f0f0; padding: 15px; border-radius: 5px; overflow-x: auto;">
&lt;IfModule mod_php7.c&gt;
    php_value memory_limit 512M
    php_value max_execution_time 300
    php_value post_max_size 100M
    php_value upload_max_filesize 100M
&lt;/IfModule&gt;</pre>

        <h3>Способ 2: Редактировать php.ini (если есть доступ)</h3>
        <p>Найдите файл <code>php.ini</code> и измените:</p>
        <pre style="background: #f0f0f0; padding: 15px; border-radius: 5px;">
memory_limit = 512M
max_execution_time = 300
post_max_size = 100M
upload_max_filesize = 100M
max_input_time = 300</pre>

        <h3>Способ 3: Обратиться к хостинг-провайдеру</h3>
        <p>Напишите в поддержку: "Прошу увеличить PHP memory_limit до 512M для работы с AI API"</p>
    </div>
    <?php endif; ?>

    <div class="result">
        <h2>📝 Следующие шаги</h2>
        <ol>
            <li>Если есть ❌ - исправьте лимиты любым способом выше</li>
            <li>Перезагрузите эту страницу - статусы должны стать ✅</li>
            <li>Запустите <a href="test-api.php" style="color: #667eea;">test-api.php</a> для проверки API</li>
            <li>Откройте <a href="index.html" style="color: #667eea;">index.html</a> и протестируйте</li>
        </ol>
    </div>

    <div style="text-align: center; margin-top: 40px; color: #666;">
        <p>После исправления проблем можно удалить этот файл.</p>
    </div>
</body>
</html>
