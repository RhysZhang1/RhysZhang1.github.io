<?php
/**
 * 漂流瓶 API
 * POST ?action=throw  — 投一个瓶子 {name, message, url?}
 * GET  ?action=pick   — 随机捞一个瓶子
 *
 * 安全措施：
 *   - 输入校验（昵称/内容长度、URL 格式）
 *   - IP 频率限制（投瓶每 IP 每分钟 1 次；捞瓶每 IP 每分钟 10 次）
 *   - 数据文件大小上限
 *   - 数据文件读-改-写全程 flock 独占锁（并发投瓶/捞瓶不丢数据）
 *   - IP 哈希盐值存于 php/secret.local.php（不入版本库），见 includes/secret.php
 */

require_once __DIR__ . '/includes/security.php';
require_once __DIR__ . '/includes/json_store.php';
require_once __DIR__ . '/includes/secret.php';
sendSecurityHeaders();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dataFile      = __DIR__ . '/../data/bottles.json';
$rateLimitFile = __DIR__ . '/../data/bottle_ratelimit.json';
$action        = $_GET['action'] ?? '';

// ---- 统计瓶子数（GET）----
if ($action === 'count') {
    $readOk = false;
    $bottles = jsonStoreRead($dataFile, [], $readOk);
    if (!$readOk) {
        http_response_code(503);
        echo json_encode(['ok' => false, 'message' => '数据暂时不可用']);
        exit;
    }
    echo json_encode(['ok' => true, 'count' => count($bottles)]);
    exit;
}

// ---- 捞瓶子（GET）----
if ($action === 'pick') {
    $readOk = false;
    $bottles = jsonStoreRead($dataFile, [], $readOk);
    if (!$readOk) {
        http_response_code(503);
        echo json_encode(['ok' => false, 'message' => '数据暂时不可用']);
        exit;
    }

    if (empty($bottles)) {
        echo json_encode(['ok' => false, 'message' => '海里还没有瓶子，扔第一个吧 🌊']);
        exit;
    }

    // ---- 频率限制：每 IP 每分钟最多 10 次捞瓶（防脚本批量扫库）----
    // 独立限流文件，与投瓶的 1 次/分钟互不干扰；检查+记录在锁内完成，避免并发绕过
    $ip     = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ipHash = hash('sha256', $ip . secretGet('bottle_pick_rl_salt'));
    $now    = time();
    $pickRateLimitFile = __DIR__ . '/../data/bottle_pick_ratelimit.json';
    $allowed = false;
    $rateUpdated = jsonStoreUpdate($pickRateLimitFile, function ($rateLimit) use ($ipHash, $now, &$allowed) {
        $rateLimit = array_values(array_filter($rateLimit, fn($e) => is_array($e) && ($e['ts'] ?? 0) > $now - 120));

        $recent = array_filter($rateLimit, fn($e) => ($e['ip'] ?? '') === $ipHash && ($e['ts'] ?? 0) > $now - 60);
        if (count($recent) >= 10) {
            $allowed = false;
            return null; // 不写回
        }

        $rateLimit[] = ['ip' => $ipHash, 'ts' => $now];
        if (count($rateLimit) > 200) {
            $rateLimit = array_slice($rateLimit, -200);
        }
        $allowed = true;
        return $rateLimit;
    });
    if (!$rateUpdated) {
        http_response_code(503);
        echo json_encode(['ok' => false, 'message' => '服务暂时不可用']);
        exit;
    }
    if (!$allowed) {
        http_response_code(429);
        echo json_encode(['ok' => false, 'message' => '捞得太频繁了，稍等片刻再试']);
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
    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    if (mb_strlen($url) > 500 || !filter_var($url, FILTER_VALIDATE_URL) || !in_array($scheme, ['http', 'https'], true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => '链接格式不正确，需要以 http:// 或 https:// 开头']);
        exit;
    }
}

// ---- 频率限制：每 IP 每分钟最多 1 次投瓶 ----
// 只存加盐哈希，数据文件不落原始 IP；检查+记录在锁内完成，避免并发绕过
$ip     = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipHash = hash('sha256', $ip . secretGet('bottle_rl_salt'));
$now    = time();
$wait   = 0;
$rateUpdated = jsonStoreUpdate($rateLimitFile, function ($rateLimit) use ($ipHash, $now, &$wait) {
    $rateLimit = array_values(array_filter($rateLimit, fn($e) => is_array($e) && ($e['ts'] ?? 0) > $now - 120));

    $recent = array_filter($rateLimit, fn($e) => ($e['ip'] ?? '') === $ipHash && ($e['ts'] ?? 0) > $now - 60);
    if (!empty($recent)) {
        $wait = 60 - ($now - max(array_column($recent, 'ts')));
        return null; // 不写回，拒绝本次投递
    }

    $rateLimit[] = ['ip' => $ipHash, 'ts' => $now];
    if (count($rateLimit) > 200) {
        $rateLimit = array_slice($rateLimit, -200);
    }
    return $rateLimit;
});
if (!$rateUpdated) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'message' => '服务暂时不可用']);
    exit;
}
if ($wait > 0) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'message' => "请等待 {$wait} 秒后再投"]);
    exit;
}

// ---- 保存瓶子（读+追加在锁内完成，并发不丢数据）----
$bottle = [
    'id'      => bin2hex(random_bytes(8)),
    'name'    => $name,
    'message' => $message,
    'url'     => $url,
    'date'    => date('Y-m-d'),
    'ip_hash' => hash('sha256', $ip . secretGet('bottle_ip_salt')),
];

$saved = jsonStoreUpdate($dataFile, function ($bottles) use ($bottle) {
    $bottles[] = $bottle;
    if (count($bottles) > 2000) {
        $bottles = array_slice($bottles, -2000);
    }
    return $bottles;
});
if (!$saved) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => '保存失败，请稍后再试']);
    exit;
}

http_response_code(201);
echo json_encode(['ok' => true, 'message' => '瓶子已扔进海里 🌊']);
