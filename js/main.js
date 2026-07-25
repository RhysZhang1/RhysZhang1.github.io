/**
 * 风春桐海君 · 个人博客 — 主逻辑
 */
let postMeta = [];
const postCache = {};

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initHeader();
  initBackTop();
  initMobile();
  initReveal();

  try {
    const r = await fetch('posts/index.json');
    if (!r.ok) throw new Error();
    postMeta = await r.json();
  } catch { postMeta = []; }

  initRouter();
  initSearch();
  initTagFilter();
  renderSidebar();
  updateHeroStats();
  renderHomePosts();
  renderPostList(postMeta);
  initTypewriter();
  handleRoute();
});

// ===== Theme =====
function initTheme() {
  if (localStorage.getItem('blog-theme') === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  updateThemeIcon();
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('blog-theme', next);
    updateThemeIcon();
    updateGiscusTheme();
    toast(next === 'dark' ? '🌙 深色模式' : '☀️ 浅色模式');
  });
}
function updateThemeIcon() {
  const el = document.querySelector('.theme-icon');
  if (el) el.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
}

// ===== Sidebar =====
function renderSidebar() {
  const tc = {};
  postMeta.forEach(p => p.tags.forEach(t => { tc[t] = (tc[t] || 0) + 1; }));
  renderTagCloud(tc);
  renderRecentPosts();
  // Stats
  ['statPosts','statPosts2'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = postMeta.length; });
  ['statTags','statTags2'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = Object.keys(tc).length; });
}

function updateHeroStats() {
  let total = 0;
  postMeta.forEach(p => {
    const cached = postCache[p.id];
    if (cached) {
      const clean = cached.replace(/```[\s\S]*?```/g, '').replace(/[#*`~\[\]()>|]/g, '').replace(/\s+/g, '');
      total += clean.length;
    } else {
      total += p.summary ? p.summary.length : 0;
    }
  });
  const el = document.getElementById('statWords');
  if (el) el.textContent = total > 1000 ? Math.round(total / 1000) + 'k' : total;
}

function renderTagCloud(counts) {
  const el = document.getElementById('tagCloud'); if (!el) return;
  const entries = Object.entries(counts);
  if (!entries.length) { el.innerHTML = '<span style="color:var(--text3);font-size:.72rem;">暂无</span>'; return; }
  const max = Math.max(...entries.map(e => e[1])), min = Math.min(...entries.map(e => e[1]));
  const cls = c => max === min ? 't-m' : (c - min) / (max - min) > .6 ? 't-l' : (c - min) / (max - min) > .2 ? 't-m' : 't-s';
  el.innerHTML = entries.sort((a, b) => b[1] - a[1]).map(([t, c]) => `<a href="#tag/${encodeURIComponent(t)}" class="${cls(c)}">${esc(t)}</a>`).join('');
}

function renderRecentPosts() {
  const el = document.getElementById('recentPostsList'); if (!el) return;
  el.innerHTML = postMeta.slice(0, 5).map(p => `<li><a href="#post/${p.id}" title="${esc(p.title)}">${esc(p.title)}</a></li>`).join('') || '<li style="color:var(--text3);font-size:.78rem;">暂无文章</li>';
}

// ===== Router =====
function initRouter() {
  window.addEventListener('hashchange', () => { handleRoute(); setTimeout(initReveal, 50); });
  document.addEventListener('click', e => {
    // TOC toggle
    const tocToggle = e.target.closest('.toc-toggle');
    if (tocToggle) { const list = tocToggle.closest('.toc-container')?.querySelector('.toc-list'); if (list) { list.classList.toggle('toc-open'); tocToggle.textContent = list.classList.contains('toc-open') ? '▲ 折叠' : '▼ 展开'; } return; }
    // TOC links: smooth scroll, never route
    const tocLink = e.target.closest('.toc-link');
    if (tocLink) { e.preventDefault(); const t = document.getElementById(tocLink.dataset.tocTarget); if (t) t.scrollIntoView({ behavior: 'smooth' }); return; }
    const link = e.target.closest('[data-page]');
    if (link) { e.preventDefault(); window.location.hash = '#' + link.dataset.page; return; }
    const card = e.target.closest('[data-post-id]');
    if (card) window.location.hash = '#post/' + card.dataset.postId;
  });
}

function handleRoute() {
  const h = window.location.hash || '#home';
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  if (h === '' || h === '#home') { show('home'); active('home'); }
  else if (h === '#blog') { show('blog'); active('blog'); resetBlogHero(); renderPostList(postMeta); }
  else if (h === '#timeline') { show('timeline'); active('timeline'); renderTimeline(); }
  else if (h === '#guestbook') { show('guestbook'); active('guestbook'); renderGuestbook(); }
  else if (h === '#about') { show('about'); active('about'); }
  else if (h.startsWith('#tag/')) { showTagArchive(decodeURIComponent(h.slice(5))); active('blog'); }
  else if (h.startsWith('#post/')) { showPost(h.slice(6)); active('blog'); }
  else { show('home'); active('home'); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function show(name) { const p = document.getElementById(name + '-page'); if (p) { p.classList.add('active'); setTimeout(initReveal, 50); } }
function active(name) { const l = document.querySelector(`.nav-link[data-page="${name}"]`); if (l) l.classList.add('active'); const b = document.querySelector(`.bottom-nav-item[data-page="${name}"]`); if (b) b.classList.add('active'); }

// ===== Tag Archive =====
function resetBlogHero() {
  const ht = document.querySelector('#blog-page .page-title');
  const hd = document.querySelector('#blog-page .page-desc');
  if (ht) ht.textContent = '📝 全部文章';
  if (hd) hd.textContent = '记录游戏故事、文学创作与随感杂记';
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = '';
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.tag-btn[data-tag="all"]');
  if (allBtn) allBtn.classList.add('active');
}
function showTagArchive(tag) {
  show('blog');
  const ht = document.querySelector('#blog-page .page-title');
  const hd = document.querySelector('#blog-page .page-desc');
  const filtered = postMeta.filter(p => p.tags.includes(tag));
  if (ht) ht.textContent = '🏷️ ' + esc(tag);
  if (hd) hd.innerHTML = '共 ' + filtered.length + ' 篇文章 · <a href="#blog" style="color:var(--accent);text-decoration:underline">← 所有标签</a>';
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = '';
  document.querySelectorAll('.tag-btn').forEach(b => { b.classList.remove('active'); if (b.dataset.tag === tag) b.classList.add('active'); });
  renderPostList(filtered);
}

// ===== Post Detail =====
async function showPost(id) {
  const meta = postMeta.find(p => p.id === id);
  const c = document.getElementById('postArticle'); if (!c) return;
  document.getElementById('post-page')?.classList.add('active');
  c.innerHTML = '<div style="max-width:720px;margin:0 auto;padding:2rem 0;">' + Array(8).fill('<div class="skeleton"></div>').join('') + '</div>';
  if (!meta) { c.innerHTML = '<div class="empty-state"><span class="empty-state-icon">📄</span><p>文章未找到</p></div>'; return; }
  try {
    if (!postCache[id]) { const r = await fetch('posts/' + meta.filename); if (!r.ok) throw new Error(); postCache[id] = await r.text(); updateHeroStats(); }
    const html = marked.parse(postCache[id], { breaks: true });
    const rt = Math.max(1, Math.ceil(postCache[id].replace(/```[\s\S]*?```/g, '').replace(/[#*`~\[\]()>|]/g, '').length / 400));
    c.innerHTML = `<div class="post-article-inner">
      <header class="post-article-header"><h1 class="post-article-title">${esc(meta.title)}</h1>
        <div class="post-article-meta"><span>📅 ${meta.date}</span><span>📖 ${rt} 分钟阅读</span></div>
        <div class="post-article-tags">${meta.tags.map(t => `<span class="post-card-tag">${esc(t)}</span>`).join('')}</div>
      </header>
      <div class="post-article-body">${html}</div>
      <div class="post-footer-actions"><a href="#blog" class="btn btn-outline">← 返回文章列表</a></div>
      <div id="giscus-container" class="giscus-section"></div></div>`;

    // === TOC: heading IDs + rebuild layout with sidebar ===
    const hCounts = {};
    const headings = c.querySelectorAll('.post-article-body h2, .post-article-body h3');
    headings.forEach(h => {
      let slug = slugify(h.textContent);
      if (hCounts[slug] !== undefined) { hCounts[slug]++; slug += '-' + hCounts[slug]; }
      else { hCounts[slug] = 0; }
      h.id = slug;
    });

    // Build TOC and create sidebar layout (if enough headings)
    const articleBody = c.querySelector('.post-article-body');
    const outer = c.querySelector('.post-article-inner');
    if (headings.length >= 2 && articleBody && outer) {
      const tocContainer = document.createElement('aside');
      tocContainer.className = 'post-article-toc';
      tocContainer.innerHTML = buildToc();

      const next = articleBody.nextElementSibling;
      const layout = document.createElement('div');
      layout.className = 'post-article-layout';
      layout.appendChild(tocContainer);
      layout.appendChild(articleBody);
      outer.insertBefore(layout, next);
    }

    // === Related Posts ===
    const related = getRelatedPosts(id, 3);
    const relatedHtml = renderRelatedPosts(related, meta.tags);
    const footerActions = c.querySelector('.post-footer-actions');
    if (relatedHtml && footerActions) {
      footerActions.insertAdjacentHTML('beforebegin', relatedHtml);
    }

    addCopyBtns(); loadGiscus(id); initReadingBar(); fetchViewCount(id); setTimeout(initReveal, 100);
  } catch { c.innerHTML = '<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>加载失败</p></div>'; }
}

function initReadingBar() {
  const bar = document.getElementById('readingProgress'); if (!bar) return;
  const onScroll = () => {
    const a = document.querySelector('.post-article-body'); if (!a) return;
    const top = a.offsetTop - 100, h = a.scrollHeight - window.innerHeight + 100;
    bar.style.width = window.scrollY <= top ? '0%' : window.scrollY >= top + h ? '100%' : ((window.scrollY - top) / h * 100) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

// ===== Giscus =====
function mountGiscus(term, destId) {
  const dest = document.getElementById(destId);
  if (!dest) return;
  dest.innerHTML = '';
  const theme = document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'https://giscus.app/themes/dark.css'
    : 'https://giscus.app/themes/light.css';
  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.setAttribute('data-repo', 'RhysZhang1/RhysZhang1.github.io');
  s.setAttribute('data-repo-id', 'R_kgDOTf36Zg');
  s.setAttribute('data-category', 'Announcements');
  s.setAttribute('data-category-id', 'DIC_kwDOTf36Zs4DBukF');
  s.setAttribute('data-mapping', 'specific');
  s.setAttribute('data-term', term);
  s.setAttribute('data-strict', '0');
  s.setAttribute('data-reactions-enabled', '1');
  s.setAttribute('data-emit-metadata', '0');
  s.setAttribute('data-input-position', 'bottom');
  s.setAttribute('data-theme', theme);
  s.setAttribute('data-lang', 'zh-CN');
  s.setAttribute('crossorigin', 'anonymous');
  s.async = true;
  dest.appendChild(s);
}

function loadGiscus(term) {
  const c = document.getElementById('giscus-container');
  const dest = c || document.getElementById('guestbook-giscus');
  if (dest) mountGiscus(term, dest.id);
  // No dest found — will be handled by renderGuestbook
}

function updateGiscusTheme() {
  document.querySelectorAll('.giscus-frame').forEach(f => {
    f.contentWindow.postMessage({ giscus: { setConfig: { theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light' } } }, 'https://giscus.app');
  });
}

// ===== Home & List =====
function renderHomePosts() {
  const g = document.getElementById('homePostGrid'); if (!g) return;
  g.innerHTML = postMeta.slice(0, 3).map((p, i) => {
    const feat = i === 0;
    return `<article class="post-card${feat ? ' featured' : ''} reveal" data-post-id="${p.id}">
      ${feat ? '<span class="featured-badge">⭐ 精选文章</span>' : ''}
      <div class="post-card-date">📅 ${p.date}</div>
      <h3 class="post-card-title">${esc(p.title)}</h3>
      <p class="post-card-summary">${esc(p.summary)}</p>
      <div class="post-card-footer">
        <div class="post-card-tags">${p.tags.map(t => `<span class="post-card-tag">${esc(t)}</span>`).join('')}</div>
        <span class="post-card-arrow">→</span>
      </div>
    </article>`;
  }).join('');
}

function renderPostList(posts) {
  const l = document.getElementById('postList'); if (!l) return;
  if (!posts.length) { l.innerHTML = '<div class="empty-state"><span class="empty-state-icon">🔍</span><p>没有找到匹配的文章</p></div>'; return; }
  l.innerHTML = posts.map(p => `<article class="post-list-item reveal" data-post-id="${p.id}">
    <div class="post-list-date">${p.date}</div>
    <div class="post-list-content">
      <h3 class="post-list-title">${esc(p.title)}</h3>
      <p class="post-list-summary">${esc(p.summary)}</p>
      <div class="post-list-meta">📖 ${Math.max(1, Math.ceil(p.summary.length / 400))} 分钟阅读</div>
      <div class="post-list-tags" style="margin-top:.3rem">${p.tags.map(t => `<span class="post-card-tag">${esc(t)}</span>`).join('')}</div>
    </div></article>`).join('');
}

// ===== Search & Tags =====
function getActiveTag() {
  if (window.location.hash.startsWith('#tag/')) return decodeURIComponent(window.location.hash.slice(5));
  return document.querySelector('.tag-btn.active')?.dataset.tag || 'all';
}
function initSearch() {
  const inp = document.getElementById('searchInput'); if (!inp) return;
  let debounceTimer;
  inp.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = inp.value.trim().toLowerCase();
      const tag = getActiveTag();
      renderPostList(postMeta.filter(p => (tag === 'all' || p.tags.includes(tag)) && (!q || p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)))));
    }, 200);
  });
}
function initTagFilter() {
  const all = new Set(); postMeta.forEach(p => p.tags.forEach(t => all.add(t)));
  const fc = document.getElementById('tagFilter'); if (!fc) return;
  fc.innerHTML = ['all', ...[...all].sort()].map(t => `<button class="tag-btn${t === 'all' ? ' active' : ''}" data-tag="${t}">${t === 'all' ? '🏷️ 全部' : t}</button>`).join('');
  fc.addEventListener('click', e => {
    if (!e.target.classList.contains('tag-btn')) return;
    const tag = e.target.dataset.tag;
    window.location.hash = tag === 'all' ? '#blog' : '#tag/' + encodeURIComponent(tag);
  });
}

// ===== Typewriter (Hero) =====
function initTypewriter() {
  const el = document.getElementById('heroTypewriter'); if (!el) return;
  const phrases = ['欲买桂花同载酒，终不似，少年游', 'Python · Java · Linux · Artificial Intelligience', '前行不会带来失去，但会带来相遇', '这世上没有纯粹的自由，风也有吹到头的时候'];
  let pi = 0, ci = 0, del = false, pause = false;
  const tick = () => {
    if (!el) return;
    const cur = phrases[pi];
    if (pause) { pause = false; del = true; setTimeout(tick, 800); return; }
    if (del) { el.textContent = cur.substring(0, ci - 1); ci--; if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; setTimeout(tick, 300); return; } setTimeout(tick, 35); }
    else { el.textContent = cur.substring(0, ci + 1); ci++; if (ci === cur.length) { pause = true; setTimeout(tick, 2200); return; } setTimeout(tick, 50 + Math.random() * 80); }
  };
  setTimeout(tick, 600);
}

// ===== Timeline =====
async function renderTimeline() {
  const c = document.getElementById('timelineContainer'); if (!c) return;
  c.innerHTML = '<div class="skeleton" style="height:200px;"></div>';
  try {
    const r = await fetch('data/timeline.json'); const entries = await r.json();
    if (!entries.length) { c.innerHTML = '<div class="empty-state"><span class="empty-state-icon">📜</span><p>暂无动态</p></div>'; return; }
    const lbl = { post: '📝 文章', github: '🐙 GitHub', milestone: '🎯 里程碑', note: '📌 笔记' };
    c.innerHTML = entries.map(e => `<div class="timeline-item reveal">
      <div class="timeline-date">${esc(e.date)}</div>
      <div class="timeline-title">
        ${e.link ? `<a href="${esc(e.link)}" ${e.link.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${esc(e.title)}</a>` : esc(e.title)}
        <span class="timeline-type-badge tbadge-${esc(e.type)}">${lbl[e.type] || e.type}</span>
      </div>
      ${e.description ? `<div class="timeline-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
    setTimeout(initReveal, 50);
  } catch { c.innerHTML = '<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>加载失败</p></div>'; }
}

// ===== Guestbook =====
function renderGuestbook() {
  const c = document.getElementById('guestbookMessages'); if (!c) return;
  fetch('data/guestbook.json').then(r => r.json()).then(msgs => {
    if (!msgs.length) return;
    c.innerHTML = msgs.map(m => `<div class="guestbook-card reveal">
      <div class="guestbook-avatar">${emoji(m.name)}</div>
      <div class="guestbook-body">
        <div class="guestbook-name">${esc(m.name)}<span class="guestbook-date">${esc(m.date)}</span></div>
        <div class="guestbook-message">${esc(m.message)}</div>
      </div></div>`).join('');
    setTimeout(initReveal, 50);
  }).catch(() => {});
  // Giscus provides the input form
  loadGuestbookGiscus();
}
function loadGuestbookGiscus() { mountGiscus('guestbook', 'guestbook-giscus'); }
function emoji(name) {
  const e = ['🦊','🐱','🐶','🐼','🐨','🐰','🦁','🐯','🐸','🐵','🐙','🦄','🐬','🦋','🐞','🦀','🐳','🦉','🐝','🦜'];
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return e[Math.abs(h) % e.length];
}

// ===== Reveal =====
function initReveal() {
  document.querySelectorAll('.reveal').forEach(el => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); ob.disconnect(); } }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
    ob.observe(el);
  });
}

// ===== Header =====
function initHeader() {
  const h = document.querySelector('.site-header'); if (!h) return;
  window.addEventListener('scroll', () => h.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
}

// ===== Back to top =====
function initBackTop() {
  const b = document.getElementById('backToTop'); if (!b) return;
  window.addEventListener('scroll', () => b.classList.toggle('visible', window.scrollY > 400), { passive: true });
  b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===== Mobile =====
function initMobile() {
  const btn = document.getElementById('mobileMenuBtn'), nav = document.querySelector('.site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => { nav.classList.toggle('open'); btn.classList.toggle('open'); });
  nav.addEventListener('click', e => { if (e.target.classList.contains('nav-link')) { nav.classList.remove('open'); btn.classList.remove('open'); } });
  document.addEventListener('click', e => { if (!btn.contains(e.target) && !nav.contains(e.target)) { nav.classList.remove('open'); btn.classList.remove('open'); } });
}

// ===== Code copy =====
function addCopyBtns() {
  document.querySelectorAll('.post-article-body pre').forEach(pre => {
    if (pre.querySelector('.copy-code-btn')) return;
    const btn = document.createElement('button'); btn.className = 'copy-code-btn'; btn.textContent = '📋 复制';
    btn.onclick = async () => {
      const code = pre.querySelector('code'); if (!code) return;
      try { await navigator.clipboard.writeText(code.textContent); btn.textContent = '✅'; btn.classList.add('copied'); toast('✅ 已复制'); setTimeout(() => { btn.textContent = '📋 复制'; btn.classList.remove('copied'); }, 2000); } catch { toast('❌ 复制失败'); }
    };
    pre.appendChild(btn);
  });
}

// ===== Toast =====
function toast(msg) {
  let ct = document.querySelector('.toast-container');
  if (!ct) { ct = document.createElement('div'); ct.className = 'toast-container'; document.body.appendChild(ct); }
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; ct.appendChild(t);
  setTimeout(() => { t.classList.add('exit'); setTimeout(() => t.remove(), 250); }, 2500);
}

// ===== Util =====
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ===== View Counter =====
async function fetchViewCount(id) {
  try {
    const r = await fetch('php/counter.php?action=view&id=' + encodeURIComponent(id));
    if (!r.ok) return;
    const data = await r.json();
    if (data && data.count !== undefined) {
      const meta = document.querySelector('.post-article-meta');
      if (meta) {
        const span = document.createElement('span');
        span.textContent = '👁️ ' + data.count;
        meta.appendChild(span);
      }
    }
  } catch { /* silently fail */ }
}

// ===== TOC & Related Posts =====
function slugify(text) {
  let slug = text
    .replace(/[^\w一-鿿぀-ゟ゠-ヿ-]+/g, '-')
    .replace(/^-+|-+$/g, '').toLowerCase().replace(/-+/g, '-');
  return slug || 'heading';
}
function buildToc() {
  const body = document.querySelector('.post-article-body');
  if (!body) return '';
  const headings = body.querySelectorAll('h2, h3');
  if (headings.length < 2) return '';
  let html = '<div class="toc-container glass-card"><a href="#blog" class="toc-back" data-page="blog" style="display:block;font-size:.82rem;margin-bottom:.6rem;color:var(--accent);text-decoration:none;font-weight:500">← 返回文章列表</a><div class="toc-header">' +
    '<span>📑 目录</span>';
  // Only show toggle button in the sidebar variant (CSS hides it on desktop)
  html += '<button class="toc-toggle" type="button">▼ 展开</button>';
  html += '</div><nav class="toc-list">';
  headings.forEach(h => {
    const level = h.tagName === 'H2' ? 'toc-h2' : 'toc-h3';
    html += '<a class="toc-link ' + level + '" href="javascript:void(0)" data-toc-target="' + h.id + '">' + esc(h.textContent) + '</a>';
  });
  html += '</nav></div>';
  return html;
}
function getRelatedPosts(currentId, limit) {
  const current = postMeta.find(p => p.id === currentId);
  if (!current || !current.tags || !current.tags.length) return [];
  return postMeta.filter(p => p.id !== currentId).map(p => ({ ...p, sharedCount: p.tags.filter(t => current.tags.includes(t)).length })).filter(p => p.sharedCount > 0).sort((a, b) => b.sharedCount - a.sharedCount).slice(0, limit);
}
function renderRelatedPosts(posts, currentTags) {
  if (!posts.length) return '';
  return '<div class="related-section reveal"><h3 class="related-title">📎 相关文章</h3><div class="related-grid">' +
    posts.map(p => {
      const sharedTags = currentTags ? p.tags.filter(t => currentTags.includes(t)) : p.tags;
      return '<article class="related-card reveal" data-post-id="' + p.id + '"><h4 class="related-card-title">' + esc(p.title) + '</h4><div class="related-card-tags">' + sharedTags.map(t => '<span class="post-card-tag">' + esc(t) + '</span>').join('') + '</div></article>';
    }).join('') + '</div></div>';
}
