<?php
/**
 * 在线阅读页 — 书库 + 阅读器（TXT / EPUB / PDF）
 *
 * 书库自动扫描 books/ 目录（txt/epub/pdf），展示名/作者来自 books/index.json，
 * 新书丢进 books/ 即可自动出现（未在 index.json 登记时用文件名兜底）。
 */

require_once __DIR__ . '/php/config.php';
require_once __DIR__ . '/php/includes/security.php';
sendSecurityHeaders();

// ---- 扫描书库 ----
$booksDir = __DIR__ . '/books';

$meta = [];
if (file_exists($booksDir . '/index.json')) {
    $meta = json_decode(file_get_contents($booksDir . '/index.json'), true) ?? [];
}
$metaByFile = [];
foreach ($meta as $m) {
    $metaByFile[$m['file'] ?? ''] = $m;
}

$books = [];
$handle = @opendir($booksDir);
if ($handle) {
    while (($entry = readdir($handle)) !== false) {
        if ($entry === '.' || $entry === '..') continue;
        if (strncmp($entry, '.', 1) === 0) continue;
        $fullPath = $booksDir . '/' . $entry;
        if (!is_file($fullPath)) continue;
        $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
        if (!in_array($ext, ['txt', 'epub', 'pdf'], true)) continue;
        $m = $metaByFile[$entry] ?? [];
        $books[] = [
            'id'     => $m['id'] ?? pathinfo($entry, PATHINFO_FILENAME),
            'title'  => $m['title'] ?? pathinfo($entry, PATHINFO_FILENAME),
            'author' => $m['author'] ?? '',
            'format' => $ext,
            'file'   => $entry,
            'size'   => filesize($fullPath),
        ];
    }
    closedir($handle);
}
usort($books, function ($a, $b) { return strcmp($a['title'], $b['title']); });

function formatSize($bytes) {
    if ($bytes === 0) return '0 B';
    $units = ['B', 'KB', 'MB', 'GB'];
    $i = min(floor(log($bytes, 1024)), count($units) - 1);
    return round($bytes / pow(1024, $i), 1) . ' ' . $units[$i];
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="在线阅读 - 书籍与故事">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#090b10">
  <link rel="icon" href="/Pic/icon.jpg" type="image/jpeg">
  <title>在线阅读 — <?php echo htmlspecialchars(SITE_NAME, ENT_QUOTES, 'UTF-8'); ?></title>
  <link rel="stylesheet" href="css/style.css?v=20260920a">
  <link rel="preconnect" href="https://fonts.loli.net">
  <link rel="preconnect" href="https://gstatic.loli.net" crossorigin>
  <link href="https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&family=Noto+Serif+SC:wght@400;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="grid-bg"></div>

  <header class="site-header">
    <div class="container">
      <a href="/" class="site-logo">
        <img src="Pic/icon.jpg" alt="" class="site-logo-img">
        风春桐海君
      </a>
      <nav class="site-nav" id="siteNav" aria-label="主导航">
        <a href="/" class="nav-link">首页</a>
        <a href="/#blog" class="nav-link">文章</a>
        <a href="/#timeline" class="nav-link">动态</a>
        <a href="/#guestbook" class="nav-link">留言</a>
        <a href="/#bottle" class="nav-link">漂流瓶</a>
        <a href="/#about" class="nav-link">关于</a>
        <a href="download.php" class="nav-link">下载</a>
        <a href="reader.php" class="nav-link active">阅读</a>
      </nav>
      <div class="header-actions">
        <button class="language-toggle" id="languageToggle" type="button" aria-label="Switch to English">
          <span data-lang-choice="zh">中</span><i></i><span data-lang-choice="en">EN</span>
        </button>
        <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="打开菜单" aria-controls="siteNav" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <main style="flex:1;padding-top:var(--header);">
    <!-- 书库 -->
    <section id="bookshelf">
      <div class="download-hero">
        <div class="container">
          <h1 class="page-title" style="margin-bottom:.5rem;"><svg class="ic"><use href="#i-book"/></svg>在线阅读</h1>
          <p style="color:var(--text2);font-size:.95rem;font-family:var(--mono);">TXT · EPUB · PDF 连续滚动阅读 · 进度自动记忆</p>
        </div>
      </div>
      <div class="container">
        <?php if (count($books) === 0): ?>
          <div class="empty-downloads">
            <div class="empty-downloads-icon"><svg class="ic"><use href="#i-book"/></svg></div>
            <h2>书库还是空的</h2>
            <p>把 txt / epub / pdf 文件放进 <code>books/</code> 文件夹即可自动出现在这里</p>
          </div>
        <?php else: ?>
          <div class="bookshelf">
            <?php foreach ($books as $b): ?>
              <article class="book-card" role="button" tabindex="0" data-id="<?php echo htmlspecialchars($b['id'], ENT_QUOTES, 'UTF-8'); ?>" aria-label="阅读《<?php echo htmlspecialchars($b['title'], ENT_QUOTES, 'UTF-8'); ?>》">
                <div class="book-cover">
                  <svg class="ic" aria-hidden="true"><use href="#i-book"/></svg>
                  <span class="book-fmt fmt-<?php echo $b['format']; ?>"><?php echo strtoupper($b['format']); ?></span>
                </div>
                <div class="book-info">
                  <h3 class="book-title"><?php echo htmlspecialchars($b['title'], ENT_QUOTES, 'UTF-8'); ?></h3>
                  <p class="book-author"><?php echo htmlspecialchars($b['author'], ENT_QUOTES, 'UTF-8'); ?></p>
                  <p class="book-meta"><?php echo formatSize($b['size']); ?> · <?php echo strtoupper($b['format']); ?></p>
                </div>
              </article>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </div>
    </section>

    <!-- 阅读器 -->
    <section id="reader" class="hidden">
      <div class="container">
        <div class="reader-topbar">
          <button id="readerBack" class="btn btn-outline" style="white-space:nowrap;">← 书库</button>
          <span class="reader-title" id="readerTitle"></span>
          <span class="reader-loadinfo" id="readerLoadInfo"></span>
          <div class="reader-fontctl" id="fontControls">
            <button id="fontMinus" aria-label="缩小字号 / PDF 缩小">A−</button>
            <button id="fontPlus" aria-label="放大字号 / PDF 放大">A+</button>
          </div>
        </div>
        <div class="reader-body" id="readerBody"></div>
      </div>
    </section>
  </main>

  <!-- 移动端底部导航栏 -->
  <nav class="bottom-nav" id="bottomNav">
    <a href="/#home" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-home"/></svg></span>
      <span class="bni-label">首页</span>
    </a>
    <a href="/#blog" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-book"/></svg></span>
      <span class="bni-label">文章</span>
    </a>
    <a href="/#guestbook" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-message"/></svg></span>
      <span class="bni-label">留言</span>
    </a>
    <a href="/#bottle" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-bottle"/></svg></span>
      <span class="bni-label">瓶子</span>
    </a>
    <a href="download.php" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-download"/></svg></span>
      <span class="bni-label">下载</span>
    </a>
  </nav>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-links">
        <a href="/#home">首页</a>
        <a href="/#blog">文章</a>
        <a href="/#timeline">动态</a>
        <a href="/#guestbook">留言</a>
        <a href="/#bottle">漂流瓶</a>
        <a href="/#about">关于</a>
        <a href="download.php">下载</a>
        <a href="reader.php">阅读</a>
        <a href="/feed.php" target="_blank" rel="noopener"><svg class="ic"><use href="#i-rss"/></svg>RSS</a>
      </div>
      <p class="footer-logo-mono">&lt;/风春桐海君&gt;</p>
      <p class="footer-philo">用代码书写诗篇，以文字打捞时间</p>
      <p class="footer-eq">e<sup>iπ</sup> + 1 = 0 &nbsp;·&nbsp; 我们由星辰所造，终将归于星辰</p>
      <p>&copy; <?php echo date('Y'); ?> <span>风春桐海君 · 用代码与文字记录时代</span></p>
    </div>
  </footer>

  <button id="backToTop" class="back-to-top" aria-label="回到顶部">↑</button>

  <script src="js/i18n.js?v=20260920b"></script>
  <script>
    (function() {
      function syncPageTitle() {
        var english = window.I18N && window.I18N.isEnglish();
        document.title = (english ? 'Online Reading' : '在线阅读') + ' — ' + (english ? 'Zephyr Harukiumi' : '风春桐海君');
      }

      var languageToggle = document.getElementById('languageToggle');
      if (languageToggle) {
        languageToggle.addEventListener('click', function() {
          window.I18N.setLanguage(window.I18N.isEnglish() ? 'zh' : 'en');
        });
      }
      window.addEventListener('languagechange', syncPageTitle);
      document.addEventListener('DOMContentLoaded', syncPageTitle, { once: true });

      var menuBtn = document.getElementById('mobileMenuBtn');
      var nav = document.querySelector('.site-nav');
      if (menuBtn && nav) {
        menuBtn.addEventListener('click', function() {
          var open = !nav.classList.contains('open');
          nav.classList.toggle('open', open);
          menuBtn.classList.toggle('open', open);
          menuBtn.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('click', function(e) {
          if (!menuBtn.contains(e.target) && !nav.contains(e.target)) {
            nav.classList.remove('open');
            menuBtn.classList.remove('open');
            menuBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
      var backBtn = document.getElementById('backToTop');
      if (backBtn) {
        window.addEventListener('scroll', function() { backBtn.classList.toggle('visible', window.scrollY > 400); });
        backBtn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      }
      var header = document.querySelector('.site-header');
      if (header) { window.addEventListener('scroll', function() { header.classList.toggle('scrolled', window.scrollY > 20); }); }
    })();
  </script>
  <script>window.BOOKS = <?php echo json_encode($books, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;</script>
  <script src="js/reader.js?v=20260908b"></script>
</body>
</html>
