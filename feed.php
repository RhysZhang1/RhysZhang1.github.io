<?php
/**
 * RSS 订阅源 — 读取 posts/index.json 生成 RSS 2.0 Feed
 */

require_once __DIR__ . '/php/config.php';
require_once __DIR__ . '/php/includes/security.php';
sendSecurityHeaders();

header('Content-Type: application/rss+xml; charset=utf-8');

$posts = [];
$indexPath = __DIR__ . '/posts/index.json';
if (file_exists($indexPath)) {
    $posts = json_decode(file_get_contents($indexPath), true) ?? [];
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><?php echo htmlspecialchars(SITE_NAME, ENT_XML1, 'UTF-8'); ?></title>
    <link><?php echo SITE_URL; ?>/</link>
    <description><?php echo htmlspecialchars(SITE_DESC, ENT_XML1, 'UTF-8'); ?></description>
    <language>zh-CN</language>
    <lastBuildDate><?php
      $dates = array_column($posts, 'date');
      rsort($dates);
      echo isset($dates[0]) ? date(DATE_RSS, strtotime($dates[0])) : date(DATE_RSS);
    ?></lastBuildDate>
    <atom:link href="<?php echo SITE_URL; ?>/feed.php" rel="self" type="application/rss+xml"/>
    <ttl>60</ttl>

<?php foreach ($posts as $post):
      $url     = SITE_URL . '/#post/' . htmlspecialchars($post['id'], ENT_XML1, 'UTF-8');
      $desc    = htmlspecialchars($post['summary'] ?? '', ENT_XML1, 'UTF-8');
      $pubDate = date(DATE_RSS, strtotime($post['date']));
      $tags    = $post['tags'] ?? [];
?>
    <item>
      <title><?php echo htmlspecialchars($post['title'], ENT_XML1, 'UTF-8'); ?></title>
      <link><?php echo $url; ?></link>
      <guid isPermaLink="true"><?php echo $url; ?></guid>
      <pubDate><?php echo $pubDate; ?></pubDate>
      <description><![CDATA[<?php echo $desc; ?>]]></description>
<?php foreach ($tags as $tag): ?>
      <category><?php echo htmlspecialchars($tag, ENT_XML1, 'UTF-8'); ?></category>
<?php endforeach; ?>
    </item>
<?php endforeach; ?>
  </channel>
</rss>
