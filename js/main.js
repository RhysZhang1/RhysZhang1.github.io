/**
 * 个人博客 — 主逻辑
 * 处理：路由、文章渲染、搜索、标签筛选、主题切换
 */

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRouter();
  initBackToTop();
  initMobileMenu();
  initSearch();
  initTagFilter();
  renderHomePosts();
  renderPostList(BLOG_POSTS);
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
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// ===== 路由系统 =====
function initRouter() {
  window.addEventListener('hashchange', handleRoute);

  // 处理导航点击
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (!link) return;
    e.preventDefault();
    const page = link.getAttribute('data-page');
    if (page === 'blog') {
      window.location.hash = '#blog';
    } else if (page === 'about') {
      window.location.hash = '#about';
    } else if (page === 'home') {
      window.location.hash = '#home';
    }
  });

  // 处理文章卡片/列表项点击（事件委托）
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-post-id]');
    if (!card) return;
    const postId = card.getAttribute('data-post-id');
    window.location.hash = `#post/${postId}`;
  });

  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || '#home';

  // 更新导航高亮
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

  if (hash === '#blog' || hash === '#home' || hash === '#about' || hash === '') {
    const pageName = hash === '' ? 'home' : hash.slice(1);
    showPage(pageName);
    highlightNav(pageName);
  } else if (hash.startsWith('#post/')) {
    const postId = hash.slice(6);
    showPost(postId);
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

function showPost(postId) {
  const post = BLOG_POSTS.find(p => p.id === postId);
  const articlePage = document.getElementById('post-page');
  const articleContainer = document.getElementById('postArticle');

  if (!articlePage || !articleContainer) return;

  articlePage.classList.add('active');

  if (!post) {
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

  articleContainer.innerHTML = `
    <button class="post-back" onclick="window.location.hash='#blog'">← 返回文章列表</button>
    <header class="post-article-header">
      <h1 class="post-article-title">${escapeHtml(post.title)}</h1>
      <div class="post-article-meta">
        <span>📅 ${post.date}</span>
      </div>
      <div class="post-article-tags">
        ${post.tags.map(t => `<span class="post-card-tag">${escapeHtml(t)}</span>`).join('')}
      </div>
    </header>
    <div class="post-article-body">
      ${post.content}
    </div>
    <div style="text-align:center;margin-top:3rem;padding-top:2rem;border-top:1px solid var(--border-color);">
      <a href="#blog" class="btn btn-outline">← 返回文章列表</a>
    </div>`;
}

// ===== 首页文章卡片 =====
function renderHomePosts() {
  const grid = document.getElementById('homePostGrid');
  if (!grid) return;

  const recent = BLOG_POSTS.slice(0, 3);
  grid.innerHTML = recent.map(post => createPostCard(post)).join('');
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

// ===== 文章卡片 HTML（首页用） =====
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

// ===== 搜索功能 =====
function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    const activeTag = document.querySelector('.tag-btn.active');
    const currentTag = activeTag ? activeTag.getAttribute('data-tag') : 'all';

    const filtered = BLOG_POSTS.filter(post => {
      const matchTag = currentTag === 'all' || post.tags.includes(currentTag);
      const matchSearch = !query ||
        post.title.toLowerCase().includes(query) ||
        post.summary.toLowerCase().includes(query) ||
        post.tags.some(t => t.toLowerCase().includes(query));
      return matchTag && matchSearch;
    });

    renderPostList(filtered);
  });
}

// ===== 标签筛选 =====
function initTagFilter() {
  const allTags = new Set();
  BLOG_POSTS.forEach(post => post.tags.forEach(t => allTags.add(t)));

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

    const filtered = BLOG_POSTS.filter(post => {
      const matchTag = tag === 'all' || post.tags.includes(tag);
      const matchSearch = !query ||
        post.title.toLowerCase().includes(query) ||
        post.summary.toLowerCase().includes(query) ||
        post.tags.some(t => t.toLowerCase().includes(query));
      return matchTag && matchSearch;
    });

    renderPostList(filtered);
  });
}

// ===== 回到顶部按钮 =====
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

  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  nav.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) {
      nav.classList.remove('open');
    }
  });

  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('open');
    }
  });
}

// ===== 工具函数 =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
