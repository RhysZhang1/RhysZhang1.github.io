<?php
/**
 * 漂流瓶 API
 * POST ?action=throw  — 投一个瓶子 {name, message, url?}
 * GET  ?action=pick   — 随机捞一个瓶子
 *
 * 安全措施：
 *   - 输入校验（昵称/内容长度、URL 格式）
 *   - IP 频率限制（每 IP 每分钟最多 1 次投瓶）
 *   - 数据文件大小上限
 */

header('Content-Type: application/json; charset=utf-8');

$dataFile      = __DIR__ . '/../data/bottles.json';
$rateLimitFile = __DIR__ . '/../data/bottle_ratelimit.json';
$action        = $_GET['action'] ?? '';

// ---- 统计瓶子数（GET）----
if ($action === 'count') {
    $bottles = [];
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        if ($content !== false) {
            $bottles = json_decode($content, true) ?? [];
        }
    }
    echo json_encode(['ok' => true, 'count' => count($bottles)]);
    exit;
}

// ---- 捞瓶子（GET）----
if ($action === 'pick') {
    $bottles = [];
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        if ($content !== false) {
            $bottles = json_decode($content, true) ?? [];
        }
    }

    if (empty($bottles)) {
        echo json_encode(['ok' => false, 'message' => '海里还没有瓶子，扔第一个吧 🌊']);
        exit;
    }

    $bottle = $bottles[array_rand($bottles)];
    unset($bottle['ip_hash']);
    echo json_encode(['ok' => true, 'bottle' => $bottle]);
    exit;
}

// ---- 投瓶子（POST）----
if ($action !== 'throw') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => '无效操作']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => '请使用 POST 提交']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => '请求数据无效']);
    exit;
}

$name    = trim($body['name'] ?? '');
$message = trim($body['message'] ?? '');
$url     = trim($body['url'] ?? '');

// ---- 校验 ----
if (mb_strlen($name) < 1 || mb_strlen($name) > 20) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => '昵称需要 1–20 个字']);
    exit;
}

$msgLen = mb_strlen($message);
if ($msgLen < 1 || $msgLen > 500) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => '内容需要 1–500 个字']);
    exit;
}

if ($url !== '') {
    if (mb_strlen($url) > 500 || !preg_match('#^https?://.+#i', $url)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => '链接格式不正确，需要以 http:// 或 https:// 开头']);
        exit;
    }
}

// ---- 频率限制：每 IP 每分钟最多 1 次投瓶 ----
// 只存加盐哈希，数据文件不落原始 IP
$ip     = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipHash = hash('sha256', $ip . 'bottle-rl-2026');
$now    = time();
$rateLimit = [];
if (file_exists($rateLimitFile)) {
    $content = file_get_contents($rateLimitFile);
    if ($content !== false) {
        $rateLimit = json_decode($content, true) ?? [];
    }
}

$rateLimit = array_values(array_filter($rateLimit, fn($e) => is_array($e) && ($e['ts'] ?? 0) > $now - 120));

$recent = array_filter($rateLimit, fn($e) => ($e['ip'] ?? '') === $ipHash && ($e['ts'] ?? 0) > $now - 60);
if (!empty($recent)) {
    $wait = 60 - ($now - max(array_column($recent, 'ts')));
    http_response_code(429);
    echo json_encode(['ok' => false, 'message' => "请等待 {$wait} 秒后再投"]);
    exit;
}

// ---- 保存瓶子 ----
$bottles = [];
if (file_exists($dataFile)) {
    $content = file_get_contents($dataFile);
    if ($content !== false) {
        $bottles = json_decode($content, true) ?? [];
    }
}

$bottle = [
    'id'      => bin2hex(random_bytes(8)),
    'name'    => $name,
    'message' => $message,
    'url'     => $url,
    'date'    => date('Y-m-d'),
    'ip_hash' => hash('sha256', $ip . 'bottle-salt-2026'),
];

$bottles[] = $bottle;

if (count($bottles) > 2000) {
    $bottles = array_slice($bottles, -2000);
}

file_put_contents($dataFile, json_encode($bottles, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

$rateLimit[] = ['ip' => $ipHash, 'ts' => $now];
if (count($rateLimit) > 200) {
    $rateLimit = array_slice($rateLimit, -200);
}
file_put_contents($rateLimitFile, json_encode($rateLimit), LOCK_EX);

http_response_code(201);
echo json_encode(['ok' => true, 'message' => '瓶子已扔进海里 🌊']);
