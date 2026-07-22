<?php
/**
 * 下载页面 — 自动扫描 downloads/ 文件夹并列出文件
 * 使用方式：把文件丢进 downloads/ 文件夹，页面自动展示，无需改代码
 */

$downloadDir = __DIR__ . '/downloads';
$siteTitle   = '下载中心';

if (!is_dir($downloadDir)) {
    mkdir($downloadDir, 0755, true);
}

// 扫描目录
$files = [];
$handle = opendir($downloadDir);
if ($handle) {
    while (($entry = readdir($handle)) !== false) {
        if ($entry === '.' || $entry === '..') continue;
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

$theme = isset($_COOKIE['blog-theme']) ? $_COOKIE['blog-theme'] : 'light';
?>
<!DOCTYPE html>
<html lang="zh-CN"<?php echo $theme === 'dark' ? ' data-theme="dark"' : ''; ?>>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="下载中心 - 资源文件分享">
  <title><?php echo $siteTitle; ?> — 我的博客</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    .download-header {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;
    }
    .file-count { font-size: 0.95rem; color: var(--text-muted); }
    .file-table {
      width: 100%; border-collapse: collapse;
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius); overflow: hidden;
    }
    .file-table th {
      background: var(--bg-secondary); padding: 0.85rem 1rem;
      text-align: left; font-size: 0.85rem; color: var(--text-secondary);
      font-weight: 600; border-bottom: 2px solid var(--border-color); white-space: nowrap;
    }
    .file-table td {
      padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-color);
      font-size: 0.95rem; vertical-align: middle;
    }
    .file-table tr:last-child td { border-bottom: none; }
    .file-table tr:hover td { background: var(--accent-bg); }
    .file-name {
      display: flex; align-items: center; gap: 0.5rem;
      font-weight: 500; color: var(--text-primary); word-break: break-all;
    }
    .file-icon { font-size: 1.3rem; flex-shrink: 0; }
    .file-size, .file-date { color: var(--text-muted); white-space: nowrap; font-size: 0.85rem; }
    .btn-download {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.4rem 1rem; background: var(--accent); color: #fff !important;
      border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500;
      white-space: nowrap; text-decoration: none;
      transition: all var(--transition);
    }
    .btn-download:hover { background: var(--accent-light); transform: translateY(-1px); }
    .empty-downloads { text-align: center; padding: 5rem 2rem; }
    .empty-downloads-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-downloads h2 { font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
    .empty-downloads p { color: var(--text-muted); font-size: 0.9rem; }
    @media (max-width: 768px) {
      .file-table th:nth-child(3), .file-table td:nth-child(3) { display: none; }
      .file-table th, .file-table td { padding: 0.65rem 0.75rem; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <a href="/" class="site-logo">📝 我的博客</a>
      <nav class="site-nav">
        <a href="index.html#home" class="nav-link">首页</a>
        <a href="index.html#blog" class="nav-link">文章</a>
        <a href="index.html#about" class="nav-link">关于</a>
        <a href="download.php" class="nav-link active">下载</a>
      </nav>
      <button class="theme-toggle" aria-label="切换主题" onclick="toggleTheme()">
        <span class="theme-icon"><?php echo $theme === 'dark' ? '☀️' : '🌙'; ?></span>
      </button>
      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="菜单">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>

  <main style="flex:1;">
    <div class="container" style="padding-top:2rem;padding-bottom:3rem;">
      <div class="download-header">
        <h1 class="page-title" style="margin:0;">📥 下载中心</h1>
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
          <div class="empty-downloads-icon">📂</div>
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
                  <a href="<?php echo $file['download_url']; ?>"
                     class="btn-download" download>
                    ⬇ 下载
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

  <footer class="site-footer">
    <div class="container">
      <p>&copy; 2026 我的博客. Powered by ❤️ and ☕</p>
    </div>
  </footer>

  <button id="backToTop" class="back-to-top visible" aria-label="回到顶部" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑</button>

  <script>
    function toggleTheme() {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      document.cookie = 'blog-theme=' + next + ';path=/;max-age=31536000';
      var icon = document.querySelector('.theme-icon');
      if (icon) icon.textContent = next === 'dark' ? '☀️' : '🌙';
    }
    document.getElementById('mobileMenuBtn').addEventListener('click', function() {
      document.querySelector('.site-nav').classList.toggle('open');
    });
    window.addEventListener('scroll', function() {
      var btn = document.getElementById('backToTop');
      if (btn) btn.classList.toggle('visible', window.scrollY > 400);
    });
    document.getElementById('backToTop').addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  </script>
</body>
</html>
