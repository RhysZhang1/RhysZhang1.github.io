/**
 * 个人博客 — 主逻辑
 * 从 posts/index.json 获取元数据，fetch .md 文件用 marked.js 渲染
 */

let postMeta = [];
const postCache = {};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initBackToTop();
  initMobileMenu();

  try {
    const resp = await fetch('posts/index.json');
    if (!resp.ok) throw new Error('Failed to load index.json');
    postMeta = await resp.json();
  } catch (err) {
    console.error('加载文章列表失败:', err);
    postMeta = [];
  }

  initRouter();
  initSearch();
  initTagFilter();
  renderHomePosts();
  renderPostList(postMeta);
});

// ===== 主题切换 =====
function initTheme() {
  const saved = localStorage.getItem('blog-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon('dark');
  }

  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('blog-theme', next);
    updateThemeIcon(next);
    updateGiscusTheme();
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ===== 路由系统 =====
function initRouter() {
  window.addEventListener('hashchange', handleRoute);

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (!link) return;
    e.preventDefault();
    window.location.hash = '#' + link.getAttribute('data-page');
  });

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-post-id]');
    if (!card) return;
    window.location.hash = `#post/${card.getAttribute('data-post-id')}`;
  });

  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || '#home';

  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

  if (hash === '#blog' || hash === '#home' || hash === '#about' || hash === '') {
    const pageName = hash === '' ? 'home' : hash.slice(1);
    showPage(pageName);
    highlightNav(pageName);
  } else if (hash.startsWith('#post/')) {
    showPost(hash.slice(6));
    highlightNav('blog');
  } else {
    showPage('home');
    highlightNav('home');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPage(name) {
  const page = document.getElementById(`${name}-page`);
  if (page) page.classList.add('active');
}

function highlightNav(name) {
  const link = document.querySelector(`.nav-link[data-page="${name}"]`);
  if (link) link.classList.add('active');
}

async function showPost(postId) {
  const meta = postMeta.find(p => p.id === postId);
  const articlePage = document.getElementById('post-page');
  const articleContainer = document.getElementById('postArticle');

  if (!articlePage || !articleContainer) return;

  articlePage.classList.add('active');

  // 加载中
  articleContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⏳</div>
      <p>加载中...</p>
    </div>`;

  if (!meta) {
    articleContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📄</div>
        <p>文章未找到</p>
      </div>
      <div style="text-align:center;margin-top:1rem;">
        <a href="#blog" class="btn btn-outline">← 返回文章列表</a>
      </div>`;
    return;
  }

  try {
    // 缓存或 fetch
    if (!postCache[postId]) {
      const resp = await fetch(`posts/${meta.filename}`);
      if (!resp.ok) throw new Error('Failed to load post');
      postCache[postId] = await resp.text();
    }

    const htmlContent = marked.parse(postCache[postId]);

    articleContainer.innerHTML = `
      <button class="post-back" onclick="window.location.hash='#blog'">← 返回文章列表</button>
      <header class="post-article-header">
        <h1 class="post-article-title">${escapeHtml(meta.title)}</h1>
        <div class="post-article-meta">
          <span>📅 ${meta.date}</span>
        </div>
        <div class="post-article-tags">
          ${meta.tags.map(t => `<span class="post-card-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </header>
      <div class="post-article-body">${htmlContent}</div>
      <div style="text-align:center;margin-top:3rem;padding-top:2rem;border-top:1px solid var(--border-color);">
        <a href="#blog" class="btn btn-outline">← 返回文章列表</a>
      </div>
      <div id="giscus-container" class="giscus-section"></div>`;

    loadGiscus(postId);
  } catch (err) {
    console.error('加载文章失败:', err);
    articleContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>文章加载失败，请稍后重试</p>
      </div>
      <div style="text-align:center;margin-top:1rem;">
        <a href="#blog" class="btn btn-outline">← 返回文章列表</a>
      </div>`;
  }
}

// ===== Giscus 评论 =====
function loadGiscus(postId) {
  const container = document.getElementById('giscus-container');
  if (!container) return;

  // 清空旧内容
  container.innerHTML = '';

  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'https://giscus.app/themes/dark.css'
    : 'https://giscus.app/themes/light.css';

  // giscus 评论组件 — 按文章 ID 隔离留言
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.setAttribute('data-repo', 'RhysZhang1/RhysZhang1.github.io');
  script.setAttribute('data-repo-id', 'R_kgDOTf36Zg');
  script.setAttribute('data-category', 'Announcements');
  script.setAttribute('data-category-id', 'DIC_kwDOTf36Zs4DBukF');
  script.setAttribute('data-mapping', 'specific');
  script.setAttribute('data-term', postId);
  script.setAttribute('data-strict', '0');
  script.setAttribute('data-reactions-enabled', '1');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', 'bottom');
  script.setAttribute('data-theme', currentTheme);
  script.setAttribute('data-lang', 'zh-CN');
  script.setAttribute('crossorigin', 'anonymous');
  script.async = true;

  container.appendChild(script);
}

// 主题切换时同步更新 giscus
function updateGiscusTheme() {
  const iframe = document.querySelector('.giscus-frame');
  if (!iframe) return;

  const theme = document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';

  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme: theme } } },
    'https://giscus.app'
  );
}

// ===== 首页文章卡片 =====
function renderHomePosts() {
  const grid = document.getElementById('homePostGrid');
  if (!grid) return;
  grid.innerHTML = postMeta.slice(0, 3).map(createPostCard).join('');
}

// ===== 文章列表渲染 =====
function renderPostList(posts) {
  const list = document.getElementById('postList');
  if (!list) return;

  if (posts.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>没有找到匹配的文章</p>
      </div>`;
    return;
  }

  list.innerHTML = posts.map(post => `
    <article class="post-list-item" data-post-id="${post.id}">
      <div class="post-list-date">${post.date}</div>
      <div class="post-list-content">
        <h3 class="post-list-title">${escapeHtml(post.title)}</h3>
        <p class="post-list-summary">${escapeHtml(post.summary)}</p>
        <div class="post-list-tags">
          ${post.tags.map(t => `<span class="post-card-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');
}

// ===== 文章卡片 HTML =====
function createPostCard(post) {
  return `
    <article class="post-card" data-post-id="${post.id}">
      <div class="post-card-date">${post.date}</div>
      <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
      <p class="post-card-summary">${escapeHtml(post.summary)}</p>
      <div class="post-card-tags">
        ${post.tags.map(t => `<span class="post-card-tag">${escapeHtml(t)}</span>`).join('')}
      </div>
    </article>`;
}

// ===== 搜索 =====
function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    const activeTag = document.querySelector('.tag-btn.active');
    const currentTag = activeTag ? activeTag.getAttribute('data-tag') : 'all';

    renderPostList(postMeta.filter(post => {
      const matchTag = currentTag === 'all' || post.tags.includes(currentTag);
      const matchSearch = !query ||
        post.title.toLowerCase().includes(query) ||
        post.summary.toLowerCase().includes(query) ||
        post.tags.some(t => t.toLowerCase().includes(query));
      return matchTag && matchSearch;
    }));
  });
}

// ===== 标签筛选 =====
function initTagFilter() {
  const allTags = new Set();
  postMeta.forEach(post => post.tags.forEach(t => allTags.add(t)));

  const filterContainer = document.getElementById('tagFilter');
  if (!filterContainer) return;

  const sortedTags = ['all', ...Array.from(allTags).sort()];
  filterContainer.innerHTML = sortedTags.map(tag =>
    `<button class="tag-btn${tag === 'all' ? ' active' : ''}" data-tag="${tag}">${tag === 'all' ? '全部' : tag}</button>`
  ).join('');

  filterContainer.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tag-btn')) return;
    filterContainer.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    const tag = e.target.getAttribute('data-tag');
    const query = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();

    renderPostList(postMeta.filter(post => {
      const matchTag = tag === 'all' || post.tags.includes(tag);
      const matchSearch = !query ||
        post.title.toLowerCase().includes(query) ||
        post.summary.toLowerCase().includes(query) ||
        post.tags.some(t => t.toLowerCase().includes(query));
      return matchTag && matchSearch;
    }));
  });
}

// ===== 回到顶部 =====
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===== 移动端菜单 =====
function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const nav = document.querySelector('.site-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => nav.classList.toggle('open'));

  nav.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) nav.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !nav.contains(e.target)) nav.classList.remove('open');
  });
}

// ===== 工具 =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
