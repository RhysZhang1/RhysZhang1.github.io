<?php
/**
 * 全局配置 — 所有 PHP 页面的共享设置
 *
 * 部署时自动检测站点域名，无需手动修改。
 * 需要硬编码时：将 SITE_URL 改为固定值，如 define('SITE_URL', 'https://example.com');
 */

// 阻止直接访问
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Direct access not permitted');
}

$scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
$host   = $_SERVER['HTTP_HOST'] ?? 'localhost';

define('SITE_URL',  $scheme . '://' . $host);
define('SITE_NAME', '风春桐海君');
define('SITE_DESC', '记录游戏故事、文学创作与随感杂记');
