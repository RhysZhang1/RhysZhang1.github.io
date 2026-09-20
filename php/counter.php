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

require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/json_store.php';
sendSecurityHeaders();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$counterFile   = __DIR__ . '/../data/counter.json';
$rateLimitFile = __DIR__ . '/../data/ratelimit.json';
$action        = $_GET['action'] ?? '';
$id            = $_GET['id'] ?? '';

if (!in_array($action, ['view', 'get'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_action']);
    exit;
}

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
$allowed = false;
$rateUpdated = jsonStoreUpdate($rateLimitFile, function ($rateLimit) use ($ipHash, $now, &$allowed) {
    $rateLimit = array_values(array_filter($rateLimit, fn($entry) => is_array($entry) && ($entry['ts'] ?? 0) > $now - 10));
    $windowCount = count(array_filter($rateLimit, fn($e) => ($e['ip'] ?? '') === $ipHash && ($e['ts'] ?? 0) > $now - 1));
    if ($windowCount >= 10) return null;
    $rateLimit[] = ['ip' => $ipHash, 'ts' => $now];
    if (count($rateLimit) > 1000) $rateLimit = array_slice($rateLimit, -1000);
    $allowed = true;
    return $rateLimit;
});
if (!$rateUpdated) {
    http_response_code(503);
    echo json_encode(['error' => 'storage_unavailable']);
    exit;
}
if (!$allowed) {
    http_response_code(429);
    header('Retry-After: 1');
    echo json_encode(['error' => 'rate_limited']);
    exit;
}

if ($action === 'view') {
    $count = 0;
    $saved = jsonStoreUpdate($counterFile, function ($data) use ($id, &$count) {
        $data[$id] = ($data[$id] ?? 0) + 1;
        if (count($data) > 10000) $data = array_slice($data, -10000, preserve_keys: true);
        $count = $data[$id];
        return $data;
    });
    if (!$saved) {
        http_response_code(503);
        echo json_encode(['error' => 'storage_unavailable']);
        exit;
    }
    echo json_encode(['id' => $id, 'count' => $count]);
} else {
    $readOk = false;
    $data = jsonStoreRead($counterFile, [], $readOk);
    if (!$readOk) {
        http_response_code(503);
        echo json_encode(['error' => 'storage_unavailable']);
        exit;
    }
    echo json_encode(['id' => $id, 'count' => $data[$id] ?? 0]);
}
