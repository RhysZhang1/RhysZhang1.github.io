<?php
/**
 * 全局配置 — 所有 PHP 页面的共享设置
 *
 * 公开 URL 固定为线上域名，避免 Host 请求头污染 RSS、Sitemap 和分享链接。
 */

// 阻止直接访问
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Direct access not permitted');
}

define('SITE_URL',  'https://7250000.xyz');
define('SITE_NAME', '风春桐海君');
define('SITE_DESC', '记录游戏故事、文学创作与随感杂记');
