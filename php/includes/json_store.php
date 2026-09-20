<?php
/**
 * 带文件锁的 JSON 数组存储。
 * 共享锁用于读取，独占锁覆盖完整的“读取-修改-写回”周期。
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(403);
    exit('Direct access not permitted');
}

function jsonStoreRead(string $path, array $default = [], ?bool &$ok = null): array
{
    $ok = false;
    $fp = @fopen($path, 'c+');
    if (!$fp) return $default;

    try {
        if (!flock($fp, LOCK_SH)) return $default;
        rewind($fp);
        $raw = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        if ($raw === false) return $default;
        if ($raw === '') {
            $ok = true;
            return $default;
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) return $default;
        $ok = true;
        return $data;
    } finally {
        fclose($fp);
    }
}

/**
 * $fn 返回新数组以写回；返回 null 表示仅检查、不写回。
 */
function jsonStoreUpdate(string $path, callable $fn): bool
{
    $fp = @fopen($path, 'c+');
    if (!$fp) return false;

    try {
        if (!flock($fp, LOCK_EX)) return false;
        rewind($fp);
        $raw = stream_get_contents($fp);
        if ($raw === false) return false;
        $data = $raw === '' ? [] : json_decode($raw, true);
        if (!is_array($data)) $data = [];

        $result = $fn($data);
        if ($result === null) {
            flock($fp, LOCK_UN);
            return true;
        }
        if (!is_array($result)) return false;

        $encoded = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encoded === false) return false;
        rewind($fp);
        if (!ftruncate($fp, 0)) return false;
        $written = fwrite($fp, $encoded);
        if ($written === false || $written !== strlen($encoded)) return false;
        if (!fflush($fp)) return false;
        flock($fp, LOCK_UN);
        return true;
    } finally {
        fclose($fp);
    }
}
