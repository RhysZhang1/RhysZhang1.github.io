<?php
/**
 * 动态 robots.txt — 由 .htaccess 将 /robots.txt 内部重写至此
 * 站点域名统一取自 php/config.php 的自动探测，避免与部署域名不一致
 */
require_once __DIR__ . '/php/config.php';

header('Content-Type: text/plain; charset=utf-8');

echo "User-agent: *\n";
echo "Allow: /\n\n";
echo 'Sitemap: ' . SITE_URL . '/sitemap.php' . "\n";
