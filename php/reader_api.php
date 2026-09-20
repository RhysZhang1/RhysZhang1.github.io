<?php
/**
 * 在线阅读 API — TXT 分页读取
 * GET ?book=<id>&pos=<字节偏移>
 *
 * 安全措施：
 *   - book 必须存在于 books/index.json 且格式为 txt（只读文本，杜绝路径穿越/任意文件读取）
 *   - pos 强转为整数并限制范围
 */

require_once __DIR__ . '/includes/security.php';
sendSecurityHeaders();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, max-age=60');

$booksDir = __DIR__ . '/../books';
$id       = $_GET['book'] ?? '';
$pos      = isset($_GET['pos']) ? (int) $_GET['pos'] : 0;
if ($pos < 0) $pos = 0;

// ---- 从 index.json 查找书籍（仅允许 txt） ----
$file = null;
if (file_exists($booksDir . '/index.json')) {
    $books = json_decode(file_get_contents($booksDir . '/index.json'), true) ?? [];
    foreach ($books as $b) {
        if (($b['id'] ?? '') === $id && strtolower((string) ($b['format'] ?? '')) === 'txt') {
            $file = $b['file'] ?? null;
            break;
        }
    }
}

if ($file === null) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'message' => '书不存在']);
    exit;
}

// 文件名白名单字符，杜绝路径穿越
if (!preg_match('/^[a-zA-Z0-9._-]+$/', $file)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => '无效的文件名']);
    exit;
}

$path  = $booksDir . '/' . $file;
if (!is_file($path) || !is_readable($path)) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'message' => '文件不可读']);
    exit;
}

$total     = filesize($path);
$chunkSize = 20000; // 每页约 2 万字节（≈1 万汉字）

if ($total === 0) {
    echo json_encode(['ok' => true, 'text' => '', 'pos' => 0, 'nextPos' => 0, 'prevPos' => 0, 'total' => 0, 'hasPrev' => false, 'hasNext' => false, 'progress' => 0]);
    exit;
}

// 越界保护
if ($pos >= $total) {
    $pos = max(0, $total - 1);
}

$fp = @fopen($path, 'rb');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => '读取失败']);
    exit;
}
fseek($fp, $pos);
// 多读 8 字节重叠区，交给 mb_strcut 按 UTF-8 安全截断，避免切断多字节字符
$raw  = fread($fp, $chunkSize + 8);
fclose($fp);

if ($raw === false || $raw === '') {
    echo json_encode(['ok' => false, 'message' => '读取失败']);
    exit;
}

// 起始对齐：pos 可能落在多字节字符中间（进度条跳转时），
// 跳过开头的续字节，丢弃那个不完整的字符，从下一个完整字符开始
$lead = 0;
$len  = strlen($raw);
while ($lead < $len && (ord($raw[$lead]) & 0xC0) === 0x80) {
    $lead++;
}
if ($lead > 0) {
    $raw = substr($raw, $lead);
}

// mb_strcut 按 UTF-8 截断：尾部不完整的多字节字符会被整体丢弃
$text = mb_strcut($raw, 0, $chunkSize, 'UTF-8');
if ($pos === 0 && $lead === 0) {
    $text = preg_replace('/^\xEF\xBB\xBF/', '', $text); // 去掉 BOM
}

$nextPos = $pos + $lead + strlen($text);
// 兜底：文件尾部若有残缺字符导致无进展，强制前进 1 字节，避免死循环
if ($nextPos <= $pos) {
    $nextPos = min($total, $pos + 1);
}
$prevPos = max(0, $pos - $chunkSize);

echo json_encode([
    'ok'      => true,
    'text'    => $text,
    'pos'     => $pos,
    'nextPos' => $nextPos,
    'prevPos' => $prevPos,
    'total'   => $total,
    'hasPrev' => $pos > 0,
    'hasNext' => $nextPos < $total,
    'progress'=> $total > 0 ? (int) floor($pos / $total * 100) : 0,
], JSON_UNESCAPED_UNICODE);
