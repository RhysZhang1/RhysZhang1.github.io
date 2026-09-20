<?php
/**
 * 动态 Sitemap 生成 — 读取 posts/index.json 输出 XML
 */

require_once __DIR__ . '/php/config.php';
require_once __DIR__ . '/php/includes/security.php';
sendSecurityHeaders();

header('Content-Type: application/xml; charset=utf-8');

$posts = [];
$indexPath = __DIR__ . '/posts/index.json';
if (file_exists($indexPath)) {
    $posts = json_decode(file_get_contents($indexPath), true) ?? [];
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

$pages = [
    ['loc' => SITE_URL . '/',               'priority' => '1.0', 'freq' => 'daily'],
    ['loc' => SITE_URL . '/#blog',           'priority' => '0.8', 'freq' => 'daily'],
    ['loc' => SITE_URL . '/#timeline',       'priority' => '0.5', 'freq' => 'weekly'],
    ['loc' => SITE_URL . '/#guestbook',      'priority' => '0.5', 'freq' => 'weekly'],
    ['loc' => SITE_URL . '/#bottle',         'priority' => '0.6', 'freq' => 'daily'],
    ['loc' => SITE_URL . '/#about',          'priority' => '0.5', 'freq' => 'monthly'],
    ['loc' => SITE_URL . '/download.php',    'priority' => '0.4', 'freq' => 'monthly'],
    ['loc' => SITE_URL . '/reader.php',      'priority' => '0.4', 'freq' => 'weekly'],
];

foreach ($pages as $p) {
    echo '  <url>' . "\n";
    echo '    <loc>' . htmlspecialchars($p['loc'], ENT_XML1, 'UTF-8') . '</loc>' . "\n";
    echo '    <priority>' . $p['priority'] . '</priority>' . "\n";
    echo '    <changefreq>' . $p['freq'] . '</changefreq>' . "\n";
    echo '  </url>' . "\n";
}

foreach ($posts as $post) {
    // 真实可抓取 URL（/post/xxx 由 .htaccess 重写到 post.php 落地页，hash 路由搜索引擎不收录）
    $url = SITE_URL . '/post/' . htmlspecialchars($post['id'], ENT_XML1, 'UTF-8');
    echo '  <url>' . "\n";
    echo '    <loc>' . $url . '</loc>' . "\n";
    echo '    <lastmod>' . htmlspecialchars($post['date'], ENT_XML1, 'UTF-8') . '</lastmod>' . "\n";
    echo '    <priority>0.6</priority>' . "\n";
    echo '    <changefreq>monthly</changefreq>' . "\n";
    echo '  </url>' . "\n";
}

echo '</urlset>' . "\n";
