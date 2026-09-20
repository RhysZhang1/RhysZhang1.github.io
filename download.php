<?php
/**
 * 下载页面 — 自动扫描 downloads/ 文件夹并列出文件
 * 使用方式：把文件丢进 downloads/ 文件夹，页面自动展示，无需改代码
 */

require_once __DIR__ . '/php/config.php';
require_once __DIR__ . '/php/includes/security.php';
sendSecurityHeaders();

$downloadDir = __DIR__ . '/downloads';

if (!is_dir($downloadDir)) {
    mkdir($downloadDir, 0755, true);
}

// 扫描目录
$files = [];
$handle = opendir($downloadDir);
if ($handle) {
    while (($entry = readdir($handle)) !== false) {
        if ($entry === '.' || $entry === '..') continue;
        // 跳过隐藏文件（.htaccess、.gitkeep 等）和脚本文件，避免被当作资源列出/下载
        if (strncmp($entry, '.', 1) === 0) continue;
        $fullPath = $downloadDir . '/' . $entry;
        if (!is_file($fullPath)) continue;
        if (pathinfo($entry, PATHINFO_EXTENSION) === 'php') continue;

        $files[] = [
            'name'         => $entry,
            'size'         => filesize($fullPath),
            'modified'     => filemtime($fullPath),
            'ext'          => strtolower(pathinfo($entry, PATHINFO_EXTENSION)),
            'download_url' => 'downloads/' . rawurlencode($entry),
        ];
    }
    closedir($handle);
}

// 按修改时间降序
usort($files, function($a, $b) {
    return $b['modified'] - $a['modified'];
});

function formatSize($bytes) {
    if ($bytes === 0) return '0 B';
    $units = ['B', 'KB', 'MB', 'GB'];
    $i = floor(log($bytes, 1024));
    $i = min($i, count($units) - 1);
    return round($bytes / pow(1024, $i), 1) . ' ' . $units[$i];
}

function fileIcon($ext) {
    $icons = [
        'pdf'  => '📄', 'doc' => '📝', 'docx' => '📝',
        'xls'  => '📊', 'xlsx'=> '📊', 'ppt'  => '📽️',
        'pptx' => '📽️', 'zip' => '📦', 'rar'  => '📦',
        '7z'   => '📦', 'gz'  => '📦', 'tar'  => '📦',
        'jpg'  => '🖼️', 'jpeg'=> '🖼️', 'png'  => '🖼️',
        'gif'  => '🖼️', 'svg' => '🖼️', 'webp' => '🖼️',
        'mp3'  => '🎵', 'wav' => '🎵', 'flac' => '🎵',
        'mp4'  => '🎬', 'avi' => '🎬', 'mkv'  => '🎬',
        'txt'  => '📃', 'md'  => '📃', 'json' => '📃',
        'py'   => '🐍', 'java'=> '☕', 'sh'   => '🐚',
        'html' => '🌐', 'css' => '🎨', 'js'   => '⚡',
        'exe'  => '⚙️', 'apk' => '📱', 'iso'  => '💿',
    ];
    return $icons[$ext] ?? '📎';
}

?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="下载中心 - 资源文件分享">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#090b10">
  <link rel="icon" href="/Pic/icon.jpg" type="image/jpeg">
  <title>下载中心 — <?php echo htmlspecialchars(SITE_NAME, ENT_QUOTES, 'UTF-8'); ?></title>
  <link rel="stylesheet" href="css/style.css?v=20260920a">
  <!-- 字体：googleapis/gstatic 大陆不可达，使用 fonts.loli.net 镜像（CSP 中两者都保留） -->
  <link rel="preconnect" href="https://fonts.loli.net">
  <link rel="preconnect" href="https://gstatic.loli.net" crossorigin>
  <link href="https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&family=Noto+Serif+SC:wght@400;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- 背景层：网格底纹（download.php 不加载 js/main.js，仅保留纯 CSS 层） -->
  <div class="grid-bg"></div>

  <!-- 鼠标效果：暖金跟随圆点 + 缓动拖尾光环 -->
  <div class="cursor-dot" id="cursorDot" aria-hidden="true"></div>
  <div class="cursor-ring" id="cursorRing" aria-hidden="true"></div>

  <!-- SVG 图标库（与 index.html 保持一致） -->
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
    <symbol id="i-home" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></g></symbol>
    <symbol id="i-book" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></g></symbol>
    <symbol id="i-clock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g></symbol>
    <symbol id="i-message" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></g></symbol>
    <symbol id="i-bottle" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6"/><path d="M10 2v3.6c0 .8-.5 1.5-1.2 1.9C7.2 8.5 6 10.3 6 12.4V19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6.6c0-2.1-1.2-3.9-2.8-4.9a2.3 2.3 0 0 1-1.2-1.9V2"/></g></symbol>
    <symbol id="i-user" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></g></symbol>
    <symbol id="i-download" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></g></symbol>
    <symbol id="i-moon" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></g></symbol>
    <symbol id="i-sun" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></symbol>
  </svg>

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
        <a href="download.php" class="nav-link active">下载</a>
        <a href="reader.php" class="nav-link">阅读</a>
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
    <div class="download-hero">
      <div class="container">
        <h1><svg class="ic"><use href="#i-download"/></svg>下载中心</h1>
        <p>分享资源与工具文件</p>
      </div>
    </div>
    <div class="container" style="padding-bottom:3rem;">
      <div class="download-header">
        <span class="file-count">
          <?php if (count($files) === 0): ?>
            暂无文件
          <?php else: ?>
            共 <?php echo count($files); ?> 个文件
          <?php endif; ?>
        </span>
      </div>

      <?php if (count($files) === 0): ?>
        <div class="empty-downloads">
          <div class="empty-downloads-icon"><svg class="ic"><use href="#i-download"/></svg></div>
          <h2>还没有文件</h2>
          <p>把文件上传到 <code>downloads/</code> 文件夹即可自动出现在这里</p>
        </div>
      <?php else: ?>
        <div style="overflow-x:auto;">
          <table class="file-table">
            <thead>
              <tr>
                <th style="width:45%;">文件名</th>
                <th>大小</th>
                <th>修改时间</th>
                <th style="width:100px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($files as $file): ?>
              <tr>
                <td>
                  <div class="file-name">
                    <span class="file-icon"><?php echo fileIcon($file['ext']); ?></span>
                    <span><?php echo htmlspecialchars($file['name']); ?></span>
                  </div>
                </td>
                <td class="file-size"><?php echo formatSize($file['size']); ?></td>
                <td class="file-date"><?php echo date('Y-m-d H:i', $file['modified']); ?></td>
                <td>
                  <a href="<?php echo htmlspecialchars($file['download_url']); ?>"
                     class="btn-download" download>
                    <svg class="ic"><use href="#i-download"/></svg>下载
                  </a>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>
    </div>
  </main>

  <!-- 移动端底部导航栏（与 index.html 结构一致） -->
  <nav class="bottom-nav" id="bottomNav">
    <a href="/#home" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-home"/></svg></span>
      <span class="bni-label">首页</span>
    </a>
    <a href="/#blog" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-book"/></svg></span>
      <span class="bni-label">文章</span>
    </a>
    <a href="/#timeline" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-clock"/></svg></span>
      <span class="bni-label">动态</span>
    </a>
    <a href="/#guestbook" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-message"/></svg></span>
      <span class="bni-label">留言</span>
    </a>
    <a href="/#bottle" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-bottle"/></svg></span>
      <span class="bni-label">瓶子</span>
    </a>
    <a href="/#about" class="bottom-nav-item">
      <span class="bni-icon"><svg class="ic"><use href="#i-user"/></svg></span>
      <span class="bni-label">关于</span>
    </a>
    <a href="download.php" class="bottom-nav-item active">
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
        document.title = (english ? 'Download Center' : '下载中心') + ' — ' + (english ? 'Zephyr Harukiumi' : '风春桐海君');
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
        window.addEventListener('scroll', function() {
          backBtn.classList.toggle('visible', window.scrollY > 400);
        });
        backBtn.addEventListener('click', function() {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      var header = document.querySelector('.site-header');
      if (header) {
        window.addEventListener('scroll', function() {
          header.classList.toggle('scrolled', window.scrollY > 20);
        });
      }

      // 鼠标效果（示例.html 风）：圆点即时跟随 + 光环缓动拖尾
      if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
        var dot = document.getElementById('cursorDot');
        var ring = document.getElementById('cursorRing');
        if (dot && ring) {
          var mx = -100, my = -100, rx = -100, ry = -100, shown = false;
          document.addEventListener('mousemove', function(e) {
            mx = e.clientX; my = e.clientY;
            dot.style.left = (mx - 4) + 'px';
            dot.style.top = (my - 4) + 'px';
            if (!shown) { shown = true; dot.classList.add('on'); ring.classList.add('on'); }
          });
          (function loop() {
            rx += (mx - rx) * 0.15;
            ry += (my - ry) * 0.15;
            ring.style.left = (rx - 18) + 'px';
            ring.style.top = (ry - 18) + 'px';
            requestAnimationFrame(loop);
          })();
        }
      }
    })();
  </script>
</body>
</html>
