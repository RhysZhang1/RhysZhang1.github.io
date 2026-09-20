<?php
/**
 * 文章落地页 — 为每篇文章提供可被搜索引擎/社交平台抓取的独立 URL
 *
 * 背景：前端文章地址是 hash 路由（/#post/xxx），fragment 不会发给服务器，
 *       搜索引擎不索引 fragment URL，微信/微博等抓取器也不执行 JS，
 *       导致文章没有独立搜索入口、分享卡片永远是首页。
 *
 * 本页：/post/xxx（由 .htaccess 重写为 post.php?id=xxx）或 /post.php?id=xxx
 *   - 服务端输出该文章完整的 title / description / og / twitter / canonical / JSON-LD
 *   - 浏览器访问时立即 302 式跳转到前端 #post/xxx（meta refresh + JS 双保险）
 *   - 无效 id 返回 404 + noindex
 */

require_once __DIR__ . '/php/config.php';
require_once __DIR__ . '/php/includes/security.php';
sendSecurityHeaders();

$id   = isset($_GET['id']) ? (string) $_GET['id'] : '';
$post = null;

if ($id !== '' && preg_match('/^[a-zA-Z0-9-]{1,100}$/', $id)) {
    $indexPath = __DIR__ . '/posts/index.json';
    if (file_exists($indexPath)) {
        $posts = json_decode(file_get_contents($indexPath), true) ?? [];
        foreach ($posts as $p) {
            if (($p['id'] ?? '') === $id) { $post = $p; break; }
        }
    }
}

if (!$post) {
    http_response_code(404);
}

$siteTitle = SITE_NAME . ' — 技术 · 游戏 · 文学';
$title     = $post ? ($post['title'] . ' — ' . SITE_NAME) : ('文章未找到 — ' . SITE_NAME);
$desc      = $post ? ($post['summary'] ?? SITE_DESC) : SITE_DESC;
$pageUrl   = $post ? (SITE_URL . '/post/' . rawurlencode($post['id'])) : SITE_URL . '/';
$imageUrl  = SITE_URL . '/Pic/icon.jpg';
$tags      = $post ? ($post['tags'] ?? []) : [];

// JSON-LD（仅文章页输出，供搜索引擎结构化展示）
$jsonLd = null;
if ($post) {
    $jsonLd = [
        '@context'         => 'https://schema.org',
        '@type'            => 'BlogPosting',
        'headline'         => $post['title'],
        'description'      => $desc,
        'datePublished'    => $post['date'] ?? '',
        'dateModified'     => $post['date'] ?? '',
        'image'            => $imageUrl,
        'url'              => $pageUrl,
        'inLanguage'       => 'zh-CN',
        'mainEntityOfPage' => $pageUrl,
        'keywords'         => implode(',', $tags),
        'author'           => ['@type' => 'Person', 'name' => SITE_NAME],
        'publisher'        => ['@type' => 'Person', 'name' => SITE_NAME],
    ];
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="<?php echo htmlspecialchars($desc, ENT_QUOTES, 'UTF-8'); ?>">
  <meta name="robots" content="<?php echo $post ? 'index,follow' : 'noindex,follow'; ?>">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#060a12">
  <link rel="icon" href="/Pic/icon.jpg" type="image/jpeg">

  <meta property="og:site_name" content="<?php echo htmlspecialchars(SITE_NAME, ENT_QUOTES, 'UTF-8'); ?>">
  <meta property="og:type" content="<?php echo $post ? 'article' : 'website'; ?>">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:url" content="<?php echo $pageUrl; ?>">
  <meta property="og:title" content="<?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?>">
  <meta property="og:description" content="<?php echo htmlspecialchars($desc, ENT_QUOTES, 'UTF-8'); ?>">
  <meta property="og:image" content="<?php echo $imageUrl; ?>">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="<?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?>">
  <meta name="twitter:description" content="<?php echo htmlspecialchars($desc, ENT_QUOTES, 'UTF-8'); ?>">
  <meta name="twitter:image" content="<?php echo $imageUrl; ?>">

  <link rel="canonical" href="<?php echo $pageUrl; ?>">
  <link rel="alternate" type="application/rss+xml" title="<?php echo htmlspecialchars(SITE_NAME, ENT_QUOTES, 'UTF-8'); ?>" href="<?php echo SITE_URL; ?>/feed.php">

  <title><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></title>

<?php if ($jsonLd): ?>
  <script type="application/ld+json"><?php echo json_encode($jsonLd, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?></script>
<?php endif; ?>
<?php if ($post): ?>
  <!-- 服务端重定向到前端 hash 路由（meta refresh + JS 双保险，bot 拿到完整元数据，用户直达文章） -->
  <meta http-equiv="refresh" content="0; url=<?php echo SITE_URL . '/#post/' . rawurlencode($post['id']); ?>">
<?php endif; ?>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#060a12;color:#e2e8f0;font-family:-apple-system,'Noto Sans SC','Microsoft YaHei',sans-serif;">
  <div style="text-align:center;padding:2rem;">
<?php if ($post): ?>
    <p style="font-size:1.05rem;margin-bottom:1rem;">正在跳转到文章《<?php echo htmlspecialchars($post['title'], ENT_QUOTES, 'UTF-8'); ?>》…</p>
    <p style="color:#64748b;font-size:.9rem;">如果页面没有自动跳转，<a style="color:#00d4ff;" href="<?php echo SITE_URL . '/#post/' . rawurlencode($post['id']); ?>">点击这里</a></p>
<?php else: ?>
    <p style="font-size:1.05rem;margin-bottom:1rem;">文章不存在或已被移除。</p>
    <p style="color:#64748b;font-size:.9rem;"><a style="color:#00d4ff;" href="<?php echo SITE_URL; ?>/">返回首页</a></p>
<?php endif; ?>
  </div>
<?php if ($post): ?>
  <script>location.replace('<?php echo SITE_URL . '/#post/' . rawurlencode($post['id']); ?>');</script>
<?php endif; ?>
</body>
</html>
