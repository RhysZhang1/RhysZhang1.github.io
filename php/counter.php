<?php
/**
 * 文章浏览量统计 API
 * GET ?action=view&id=xxx  — 增加浏览次数并返回
 * GET ?action=get&id=xxx   — 仅返回当前浏览次数
 *
 * 安全措施：
 *   - ID 格式校验（仅允许字母数字和连字符，最长 100 字符）
 *   - IP 频率限制（每 IP 每秒最多 10 次请求）
 *   - 数据文件大小上限保护
 */

header('Content-Type: application/json; charset=utf-8');

$counterFile   = __DIR__ . '/../data/counter.json';
$rateLimitFile = __DIR__ . '/../data/ratelimit.json';
$action        = $_GET['action'] ?? '';
$id            = $_GET['id'] ?? '';

// ---- 校验 ID ----
if ($id === '' || !preg_match('/^[a-zA-Z0-9-]{1,100}$/', $id)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_id']);
    exit;
}

// ---- 频率限制 ----
// 只存加盐哈希，数据文件不落原始 IP
$ip     = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipHash = hash('sha256', $ip . 'counter-rl-2026');
$now    = time();
$rateLimit = [];
if (file_exists($rateLimitFile)) {
    $content = file_get_contents($rateLimitFile);
    if ($content !== false) {
        $rateLimit = json_decode($content, true) ?? [];
    }
}

// 清理 10 秒前的记录
$rateLimit = array_values(array_filter($rateLimit, fn($entry) => is_array($entry) && ($entry['ts'] ?? 0) > $now - 10));

// 统计当前 IP 在最近 1 秒内的请求次数
$windowCount = count(array_filter($rateLimit, fn($e) => ($e['ip'] ?? '') === $ipHash && ($e['ts'] ?? 0) > $now - 1));
if ($windowCount >= 10) {
    http_response_code(429);
    header('Retry-After: 1');
    echo json_encode(['error' => 'rate_limited']);
    exit;
}

$rateLimit[] = ['ip' => $ipHash, 'ts' => $now];
if (count($rateLimit) > 1000) {
    $rateLimit = array_slice($rateLimit, -1000);
}
file_put_contents($rateLimitFile, json_encode($rateLimit), LOCK_EX);

// ---- 读取浏览数据 ----
$data = [];
if (file_exists($counterFile)) {
    $content = file_get_contents($counterFile);
    if ($content !== false) {
        $data = json_decode($content, true) ?? [];
    }
}

if ($action === 'view') {
    $data[$id] = ($data[$id] ?? 0) + 1;
    // 防止数据文件无限膨胀
    if (count($data) > 10000) {
        $data = array_slice($data, -10000, preserve_keys: true);
    }
    file_put_contents($counterFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    echo json_encode(['id' => $id, 'count' => $data[$id]]);
} elseif ($action === 'get') {
    echo json_encode(['id' => $id, 'count' => $data[$id] ?? 0]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_action']);
}
