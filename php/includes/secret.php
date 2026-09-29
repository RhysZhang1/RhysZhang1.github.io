<?php
/**
 * 本地私密值读取
 *
 * 盐值一类不应进入版本库的字符串存放在 php/secret.local.php（不纳入版本控制）。
 * 该文件不存在时自动生成一份随机值并落盘，保证新部署开箱即用、无需手工建文件。
 *
 * 用法：secretGet('bottle_rl_salt')
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(403);
    exit('Direct access not permitted');
}

/**
 * 取一个私密值；缺失时随机生成并持久化。
 * 同一请求内重复调用走静态缓存，不重复读盘。
 */
function secretGet(string $key): string
{
    static $values = null;

    if ($values === null) {
        $file   = __DIR__ . '/../secret.local.php';
        $loaded = is_file($file) ? require $file : [];
        $values = is_array($loaded) ? $loaded : [];
    }

    if (empty($values[$key])) {
        $values[$key] = bin2hex(random_bytes(32));
        secretSave($values);
    }

    return (string) $values[$key];
}

/**
 * 原子写入私密值文件。
 * 先写临时文件再 rename，避免并发请求读到写了一半的内容；权限收紧到仅属主可读。
 */
function secretSave(array $values): void
{
    $file = __DIR__ . '/../secret.local.php';
    $php  = "<?php\n"
          . "// 本地私密值 —— 不纳入版本控制，请勿提交、同步或分享\n"
          . "// 盐值一旦更换，此前用旧盐生成的哈希将无法与新的比对（限流窗口会自动过期，无长期影响）\n"
          . "if (basename(\$_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {\n"
          . "    http_response_code(403);\n"
          . "    exit('Direct access not permitted');\n"
          . "}\n\n"
          . 'return ' . var_export($values, true) . ";\n";

    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (@file_put_contents($tmp, $php, LOCK_EX) !== false) {
        @chmod($tmp, 0600);
        @rename($tmp, $file);
    }
}
