<?php
/**
 * 动态 Sitemap 生成
 * 读取 posts/index.json 输出 XML
 */

header('Content-Type: application/xml; charset=utf-8');

$siteUrl = 'https://rhyszhang1.github.io';

// 读取文章元数据
$posts = [];
$indexPath = __DIR__ . '/posts/index.json';
if (file_exists($indexPath)) {
    $posts = json_decode(file_get_contents($indexPath), true) ?? [];
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// 静态页面
$pages = [
    ['loc' => $siteUrl . '/',               'priority' => '1.0', 'freq' => 'daily'],
    ['loc' => $siteUrl . '/#blog',           'priority' => '0.8', 'freq' => 'daily'],
    ['loc' => $siteUrl . '/#timeline',       'priority' => '0.5', 'freq' => 'weekly'],
    ['loc' => $siteUrl . '/#guestbook',      'priority' => '0.5', 'freq' => 'weekly'],
    ['loc' => $siteUrl . '/#about',          'priority' => '0.5', 'freq' => 'monthly'],
    ['loc' => $siteUrl . '/download.php',    'priority' => '0.4', 'freq' => 'monthly'],
];

foreach ($pages as $p) {
    echo '  <url>' . "\n";
    echo '    <loc>' . htmlspecialchars($p['loc'], ENT_XML1, 'UTF-8') . '</loc>' . "\n";
    echo '    <priority>' . $p['priority'] . '</priority>' . "\n";
    echo '    <changefreq>' . $p['freq'] . '</changefreq>' . "\n";
    echo '  </url>' . "\n";
}

// 文章页面
foreach ($posts as $post) {
    $url = $siteUrl . '/#post/' . htmlspecialchars($post['id'], ENT_XML1, 'UTF-8');
    echo '  <url>' . "\n";
    echo '    <loc>' . $url . '</loc>' . "\n";
    echo '    <lastmod>' . htmlspecialchars($post['date'], ENT_XML1, 'UTF-8') . '</lastmod>' . "\n";
    echo '    <priority>0.6</priority>' . "\n";
    echo '    <changefreq>monthly</changefreq>' . "\n";
    echo '  </url>' . "\n";
}

echo '</urlset>' . "\n";
