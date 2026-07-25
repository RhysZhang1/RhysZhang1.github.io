<?php
/**
 * 文章浏览量统计 API
 * GET ?action=view&id=xxx  — 增加浏览次数并返回
 * GET ?action=get&id=xxx   — 仅返回当前浏览次数
 */

header('Content-Type: application/json; charset=utf-8');

$counterFile = __DIR__ . '/../data/counter.json';
$action      = $_GET['action'] ?? '';
$id          = $_GET['id'] ?? '';

// 校验 ID：只允许字母、数字和连字符
if (!preg_match('/^[a-zA-Z0-9-]+$/', $id)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_id']);
    exit;
}

// 读取数据
$data = [];
if (file_exists($counterFile)) {
    $content = file_get_contents($counterFile);
    if ($content !== false) {
        $data = json_decode($content, true) ?? [];
    }
}

if ($action === 'view') {
    $data[$id] = ($data[$id] ?? 0) + 1;
    file_put_contents($counterFile, json_encode($data, JSON_PRETTY_PRINT));
    echo json_encode(['id' => $id, 'count' => $data[$id]]);
} elseif ($action === 'get') {
    echo json_encode(['id' => $id, 'count' => $data[$id] ?? 0]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_action']);
}
