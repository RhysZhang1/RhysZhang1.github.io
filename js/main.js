/**
 * 风春桐海君 · 个人博客 — 主逻辑
 */

// ===== 全局配置 =====
const CONFIG = {
  siteUrl: window.location.origin,
  giscus: {
    repo: 'RhysZhang1/RhysZhang1.github.io',
    repoId: 'R_kgDOTf36Zg',
    category: 'Announcements',
    categoryId: 'DIC_kwDOTf36Zs4DBukF',
  },
};

let postMeta = [];
let postMetaEn = new Map();
const postCache = {};
const postCacheEn = {};
// ===== 全文搜索索引（运行时构建，复用 postCache 的 md 缓存） =====
const searchBody = new Map();      // id -> 剥离后的纯文本（已 normalize）
let searchIndexPromise = null;     // 单例 Promise，避免重复 fetch
let searchSeq = 0;                 // 递增序号，防过期结果覆盖新查询
let pendingHighlight = null;       // 从搜索/⌘K 跳转文章时，携带的搜索词（文章渲染后高亮）
let readingBarHandler = null;      // 当前文章的阅读进度监听器
let tocObserver = null;            // 当前文章的目录观察器

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
  // 平台相关显示：macOS 显示 ⌘K，其余平台显示 Ctrl K
  const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const cmdKShortcut = document.getElementById('cmdKShortcut');
  if (cmdKShortcut) cmdKShortcut.textContent = IS_MAC ? '⌘K' : 'Ctrl K';
  // 版权年份自动更新（避免跨年过期）
  const copyrightYear = document.getElementById('copyrightYear');
  if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());
  initCommandPalette();
  initLanguageToggle();
  initHeader();
  initBackTop();
  initMobile();
  initReveal();
  initLightbox();
  // prefers-reduced-motion：跳过动效型初始化
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!REDUCED) {
    initTilt();
    initCursor();
    initHeroParallax();
    initParticleCanvas();
    initMathFloaters();
    initWandererAmbient();
  }
  document.addEventListener('visibilitychange', () => {
    const hero = document.querySelector('.hero');
    if (hero) hero.classList.toggle('paused', document.hidden);
  });

  try {
    const [r, er] = await Promise.all([fetch('posts/index.json?v=20260908c'), fetch('posts/index.en.json?v=20260908c')]);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    postMeta = await r.json();
    if (er.ok) postMetaEn = new Map((await er.json()).map(p => [p.id, p]));
  } catch (e) { console.warn('加载文章索引失败：', e); postMeta = []; }

  initRouter();
  initSearch();
  initTagFilter();
  renderSidebar();
  updateHeroStats();
  renderHomePosts();
  renderPostList(postMeta);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const tw = document.getElementById('heroTypewriter');
    if (tw) tw.textContent = isEnglish() ? 'Wine and osmanthus I would share—yet the young days cannot return.' : '欲买桂花同载酒，终不似，少年游'; // 静态展示，不做打字动画
  } else {
    initTypewriter();
  }
  handleRoute();
});

function isEnglish() { return window.I18N?.isEnglish() || false; }
function tr(key, vars) { return window.I18N?.t(key, vars) || key; }
function postView(post) { return isEnglish() ? { ...post, ...(postMetaEn.get(post.id) || {}) } : post; }
function tagView(tag) {
  if (!isEnglish()) return tag;
  const owner = postMeta.find(p => p.tags.includes(tag));
  return owner ? (postView(owner).tags[owner.tags.indexOf(tag)] || tag) : tag;
}
function translateRoot(root) { window.I18N?.apply(root || document); }

function initLanguageToggle() {
  const toggle = document.getElementById('languageToggle');
  if (toggle) toggle.addEventListener('click', () => window.I18N?.setLanguage(isEnglish() ? 'zh' : 'en'));
}

window.addEventListener('languagechange', () => {
  if (!document.body) return;
  renderSidebar();
  renderHomePosts();
  initTagFilter(true);
  renderCmdK(document.getElementById('cmdKInput')?.value || '');
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) initTypewriter();
  handleRoute();
});

// ===== 背景装饰：粒子连线 =====
function initParticleCanvas() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  class P {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.4 + 0.1;
    }
    update() {
      this.x += this.speedX; this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(135, 191, 195, ' + (this.opacity * 0.55) + ')';
      ctx.fill();
    }
  }
  const N = Math.min(80, Math.max(24, Math.floor(window.innerWidth / 16)));
  for (let i = 0; i < N; i++) particles.push(new P());
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(214, 184, 120, ' + (0.035 * (1 - dist / 150)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animate);
  }
  animate();
}

// ===== 背景装饰：浮动数学符号 =====
function initMathFloaters() {
  const box = document.getElementById('mathFloaters');
  if (!box) return;
  const symbols = ['∑', '∫', '∂', '√', '∞', 'λ', 'π', 'θ', 'Δ', '∇', '∈', '∀', '∃', '⊂', '⊗', '⊕'];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('span');
    el.className = 'math-floater';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = Math.random() * 100 + '%';
    el.style.animationDuration = (20 + Math.random() * 40) + 's';
    el.style.animationDelay = Math.random() * 30 + 's';
    el.style.fontSize = (2 + Math.random() * 5) + 'rem';
    box.appendChild(el);
  }
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
  const total = postMeta.reduce((sum, p) => sum + (Number(p.wordCount) || 0), 0);
  const el = document.getElementById('statWords');
  if (el) el.textContent = total > 1000 ? Math.round(total / 1000) + 'k' : total;
}

function renderTagCloud(counts) {
  const el = document.getElementById('tagCloud'); if (!el) return;
  const entries = Object.entries(counts);
  if (!entries.length) { el.innerHTML = '<span style="color:var(--text3);font-size:.72rem;">' + tr('empty') + '</span>'; return; }
  const max = Math.max(...entries.map(e => e[1])), min = Math.min(...entries.map(e => e[1]));
  const cls = c => max === min ? 't-m' : (c - min) / (max - min) > .6 ? 't-l' : (c - min) / (max - min) > .2 ? 't-m' : 't-s';
  el.innerHTML = entries.sort((a, b) => b[1] - a[1]).map(([t, c]) => `<a href="#tag/${encodeURIComponent(t)}" class="${cls(c)}">${esc(tagView(t))}</a>`).join('');
}

function renderRecentPosts() {
  const el = document.getElementById('recentPostsList'); if (!el) return;
  el.innerHTML = postMeta.slice(0, 5).map(raw => { const p = postView(raw); return `<li><a href="#post/${p.id}" title="${esc(p.title)}">${esc(p.title)}</a></li>`; }).join('') || '<li style="color:var(--text3);font-size:.78rem;">' + tr('empty') + '</li>';
}

// ===== Router =====
function initRouter() {
  window.addEventListener('hashchange', () => {
    closeCommandPalette(); // 先关 ⌘K，避免 View Transitions 快照把它冻结进转场
    const apply = () => { handleRoute(); setTimeout(initReveal, 50); };
    if (document.startViewTransition) document.startViewTransition(apply);
    else apply();
  });
  document.addEventListener('click', e => {
    // TOC toggle
    const tocToggle = e.target.closest('.toc-toggle');
    if (tocToggle) { const list = tocToggle.closest('.toc-container')?.querySelector('.toc-list'); if (list) { list.classList.toggle('toc-open'); tocToggle.textContent = list.classList.contains('toc-open') ? tr('collapse') : tr('expand'); } return; }
    // TOC links: smooth scroll, never route
    const tocLink = e.target.closest('.toc-link');
    if (tocLink) { e.preventDefault(); const t = document.getElementById(tocLink.dataset.tocTarget); if (t) t.scrollIntoView({ behavior: 'smooth' }); return; }
    // Heading anchors: smooth scroll, never route
    const anchor = e.target.closest('.heading-anchor');
    if (anchor) { e.preventDefault(); const t = document.getElementById(anchor.getAttribute('href').slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth' }); return; }
    const link = e.target.closest('[data-page]');
    if (link) { e.preventDefault(); window.location.hash = '#' + link.dataset.page; return; }
    const card = e.target.closest('[data-post-id]');
    if (card) {
      // 从正文搜索/相关文章跳转时，携带当前搜索词供文章内高亮
      const q = (document.getElementById('searchInput') || {}).value || '';
      pendingHighlight = q ? normalize(q).split(/\s+/).filter(Boolean) : null;
      window.location.hash = '#post/' + card.dataset.postId;
      return;
    }
  });
}

function handleRoute() {
  const h = window.location.hash || '#home';
  if (!h.startsWith('#post/')) cleanupArticleObservers();
  document.querySelectorAll('.nav-link').forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
  document.querySelectorAll('.bottom-nav-item').forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  if (h === '' || h === '#home') { show('home'); active('home'); }
  else if (h === '#blog') { show('blog'); active('blog'); resetBlogHero(); renderPostList(postMeta); }
  else if (h === '#timeline') { show('timeline'); active('timeline'); renderTimeline(); }
  else if (h === '#guestbook') { show('guestbook'); active('guestbook'); renderGuestbook(); }
  else if (h === '#bottle') { show('bottle'); active('bottle'); initBottle(); }
  else if (h === '#about') { show('about'); active('about'); }
  else if (h === '#wanderer') { show('wanderer'); active('wanderer'); initWanderer(); }
  else if (h.startsWith('#tag/')) { showTagArchive(decodeURIComponent(h.slice(5))); active('blog'); }
  else if (h.startsWith('#post/')) { showPost(h.slice(6)); active('blog'); }
  else { show('home'); active('home'); }
  updateMeta();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function show(name) { const p = document.getElementById(name + '-page'); if (p) { p.classList.add('active'); setTimeout(initReveal, 50); } }
function active(name) {
  const l = document.querySelector(`.nav-link[data-page="${name}"]`);
  const b = document.querySelector(`.bottom-nav-item[data-page="${name}"]`);
  if (l) { l.classList.add('active'); l.setAttribute('aria-current', 'page'); }
  if (b) { b.classList.add('active'); b.setAttribute('aria-current', 'page'); }
}

// ===== SEO meta（社交分享卡片） =====
function updateMeta() {
  const h = window.location.hash || '#home';
  let title = document.title;
  let desc = document.querySelector('meta[name="description"]')?.content || '';
  if (h.startsWith('#post/')) {
    const p = postMeta.find(p => p.id === h.slice(6));
    if (p) { const view = postView(p); title = view.title + ' — ' + tr('siteName'); desc = view.summary || desc; }
  } else if (h.startsWith('#tag/')) {
    title = decodeURIComponent(h.slice(5)) + ' — ' + tr('siteName');
  }
  const setMeta = (sel, val) => { const el = document.querySelector(sel); if (el) el.setAttribute('content', val); };
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', desc);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', desc);
  setMeta('meta[property="og:url"]', window.location.origin + window.location.pathname + window.location.hash);
  document.title = title;
  // og:image 必须为绝对路径，否则微信/微博/Twitter 抓取器无法识别
  const absImage = window.location.origin + '/Pic/og-archive.png';
  setMeta('meta[property="og:image"]', absImage);
  setMeta('meta[name="twitter:image"]', absImage);
}

// ===== Tag Archive =====
function resetBlogHero() {
  const ht = document.querySelector('#blog-page .page-title');
  const hd = document.querySelector('#blog-page .page-desc');
  if (ht) ht.innerHTML = ic('book') + tr('allPosts');
  if (hd) hd.textContent = isEnglish() ? 'Game stories, creative writing, and personal reflections' : '记录游戏故事、文学创作与随感杂记';
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = '';
  clearBodySearch();
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('.tag-btn[data-tag="all"]');
  if (allBtn) allBtn.classList.add('active');
}
function showTagArchive(tag) {
  show('blog');
  const ht = document.querySelector('#blog-page .page-title');
  const hd = document.querySelector('#blog-page .page-desc');
  const filtered = postMeta.filter(p => p.tags.includes(tag));
  const displayTag = filtered.length ? (postView(filtered[0]).tags[filtered[0].tags.indexOf(tag)] || tag) : tag;
  if (ht) ht.innerHTML = ic('tag') + esc(displayTag);
  if (hd) hd.innerHTML = isEnglish()
    ? filtered.length + ' posts · <a href="#blog" style="color:var(--accent);text-decoration:underline">← All tags</a>'
    : '共 ' + filtered.length + ' 篇文章 · <a href="#blog" style="color:var(--accent);text-decoration:underline">← 所有标签</a>';
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = '';
  clearBodySearch();
  document.querySelectorAll('.tag-btn').forEach(b => { b.classList.remove('active'); if (b.dataset.tag === tag) b.classList.add('active'); });
  renderPostList(filtered);
}

// ===== Post Detail =====
async function showPost(id) {
  const sourceMeta = postMeta.find(p => p.id === id);
  const meta = sourceMeta ? postView(sourceMeta) : null;
  const c = document.getElementById('postArticle'); if (!c) return;
  document.getElementById('post-page')?.classList.add('active');
  c.innerHTML = '<div style="max-width:720px;margin:0 auto;padding:2rem 0;">' + Array(8).fill('<div class="skeleton"></div>').join('') + '</div>';
  if (!meta) { c.innerHTML = '<div class="empty-state"><span class="empty-state-icon">' + ic('book') + '</span><p>' + tr('postNotFound') + '</p></div>'; return; }
  try {
    if (!postCache[id]) { const r = await fetch('posts/' + sourceMeta.filename); if (!r.ok) throw new Error(); postCache[id] = await r.text(); updateHeroStats(); }
    if (isEnglish() && !postCacheEn[id]) {
      const er = await fetch('posts/en/' + sourceMeta.filename);
      if (!er.ok) throw new Error('English translation unavailable');
      postCacheEn[id] = await er.text();
    }
    const markdownReady = typeof marked !== 'undefined' && typeof marked.parse === 'function';
    const html = markdownReady ? marked.parse(postCache[id], { breaks: true }) : '';
    // 任一渲染依赖不可用时安全降级为纯文本，绝不直接注入未清理的 HTML。
    const cleanHtml = markdownReady && typeof DOMPurify !== 'undefined'
      ? DOMPurify.sanitize(html)
      : '<pre class="markdown-fallback">' + esc(postCache[id]) + '</pre>';
    const enHtml = isEnglish() && markdownReady ? marked.parse(postCacheEn[id], { breaks: true }) : '';
    const cleanEnHtml = isEnglish() && markdownReady && typeof DOMPurify !== 'undefined'
      ? DOMPurify.sanitize(enHtml)
      : (isEnglish() ? '<pre class="markdown-fallback">' + esc(postCacheEn[id]) + '</pre>' : '');
    const rt = Math.max(1, Math.ceil(postCache[id].replace(/```[\s\S]*?```/g, '').replace(/[#*`~\[\]()>|]/g, '').length / 400));
    const articleContent = isEnglish()
      ? `<section class="article-language article-language-zh" lang="zh-CN"><div class="article-language-label">中文原文</div>${cleanHtml}</section>
         <section class="article-language article-language-en" lang="en"><div class="article-language-label">English Translation</div>${cleanEnHtml}</section>`
      : cleanHtml;
    c.innerHTML = `<div class="post-article-inner">
      <header class="post-article-header"><h1 class="post-article-title">${esc(meta.title)}</h1>
        <div class="post-article-meta"><span>${ic('calendar')}${meta.date}</span><span>${ic('book')}${tr('minuteRead', { count: rt })}</span></div>
        <div class="post-article-tags">${meta.tags.map(t => `<span class="post-card-tag">${esc(t)}</span>`).join('')}</div>
      </header>
      <div class="post-article-body">${articleContent}</div>
      <div class="post-footer-actions"><a href="#blog" class="btn btn-outline">${tr('backToPosts')}</a></div>
      <div id="giscus-container" class="giscus-section"></div></div>`;

    if (id === 'titan-hymns') await enhanceTitanHymns(c);

    // === TOC: heading IDs + rebuild layout with sidebar ===
    const hCounts = {};
    const headingRoot = isEnglish() ? c.querySelector('.article-language-en') : c.querySelector('.post-article-body');
    const headings = id === 'titan-hymns' ? [] : (headingRoot ? headingRoot.querySelectorAll('h2, h3') : []);
    headings.forEach(h => {
      let slug = slugify(h.textContent);
      if (hCounts[slug] !== undefined) { hCounts[slug]++; slug += '-' + hCounts[slug]; }
      else { hCounts[slug] = 0; }
      h.id = slug;
      const a = document.createElement('a');
      a.className = 'heading-anchor';
      a.href = '#' + slug;
      a.setAttribute('aria-label', isEnglish() ? 'Jump to ' + h.textContent : '跳转到' + h.textContent);
      a.textContent = '#';
      h.appendChild(a);
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
    const relatedHtml = renderRelatedPosts(related, sourceMeta.tags);
    const footerActions = c.querySelector('.post-footer-actions');
    if (relatedHtml && footerActions) {
      footerActions.insertAdjacentHTML('beforebegin', relatedHtml);
    }

    lazyLoadImages(c); addCopyBtns(); loadGiscus(id); initReadingBar(); fetchViewCount(id); initScrollspy(); highlightInArticle(); setTimeout(initReveal, 100);
  } catch (e) { console.warn('加载文章失败：', e); c.innerHTML = '<div class="empty-state"><span class="empty-state-icon">' + ic('x') + '</span><p>' + tr('loadFailed') + '</p></div>'; }
}

async function enhanceTitanHymns(article) {
  try {
    const response = await fetch('posts/titan-hymns.json?v=20260908c');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    const root = article.querySelector(isEnglish() ? '.article-language-zh' : '.post-article-body');
    if (!root || !Array.isArray(data.chapters) || !data.chapters.length) return;
    article.classList.add('titan-article');

    const languageLabel = root.querySelector(':scope > .article-language-label');
    const fallbackHtml = Array.from(root.children)
      .filter(node => node !== languageLabel)
      .map(node => node.outerHTML)
      .join('');
    Array.from(root.children).forEach(node => { if (node !== languageLabel) node.remove(); });

    const eras = [...new Set(data.chapters.map(item => item.era))];
    const shell = document.createElement('section');
    shell.className = 'titan-atlas';
    shell.setAttribute('aria-label', '泰坦颂诗交互档案');
    shell.innerHTML = `<div class="titan-atlas-sky" aria-hidden="true"></div>
      <header class="titan-atlas-head">
        <p class="titan-atlas-kicker">AMPHOREUS · TITAN ARCHIVE</p>
        <h2>${esc(data.title || '泰坦颂诗')}</h2>
        <p>${esc(data.description || '')}</p>
        <div class="titan-era-tabs" role="tablist" aria-label="选择纪元"></div>
      </header>
      <div class="titan-atlas-grid">
        <nav class="titan-roster" aria-label="选择泰坦"></nav>
        <article class="titan-scroll" tabindex="0" aria-live="polite">
          <div class="titan-scroll-meta"></div>
          <h3 class="titan-scroll-title"></h3>
          <div class="titan-scroll-text"></div>
          <footer class="titan-scroll-controls">
            <button type="button" data-direction="prev" aria-label="上一篇颂诗">← <span>上一篇</span></button>
            <span class="titan-scroll-progress"></span>
            <button type="button" data-direction="next" aria-label="下一篇颂诗"><span>下一篇</span> →</button>
          </footer>
        </article>
      </div>`;
    root.appendChild(shell);

    const fallback = document.createElement('details');
    fallback.className = 'titan-fallback';
    fallback.innerHTML = `<summary>展开普通文章目录与完整原文</summary><div class="titan-fallback-body">${fallbackHtml}</div>`;
    root.appendChild(fallback);

    const tabs = shell.querySelector('.titan-era-tabs');
    const roster = shell.querySelector('.titan-roster');
    const title = shell.querySelector('.titan-scroll-title');
    const meta = shell.querySelector('.titan-scroll-meta');
    const text = shell.querySelector('.titan-scroll-text');
    const progress = shell.querySelector('.titan-scroll-progress');
    let activeEra = eras[0];
    let activeTitan = '';
    let activeChapter = 0;

    const titansForEra = () => [...new Set(data.chapters.filter(item => item.era === activeEra).map(item => item.titan))];
    const chaptersForTitan = () => data.chapters.filter(item => item.era === activeEra && item.titan === activeTitan);

    function renderTabs() {
      tabs.innerHTML = eras.map(era => `<button type="button" role="tab" aria-selected="${era === activeEra}" class="${era === activeEra ? 'active' : ''}" data-era="${esc(era)}">${esc(era)}</button>`).join('');
    }

    function renderRoster() {
      roster.innerHTML = titansForEra().map((titan, index) => {
        const first = data.chapters.find(item => item.era === activeEra && item.titan === titan);
        return `<button type="button" class="${titan === activeTitan ? 'active' : ''}" data-titan="${esc(titan)}">
          <span class="titan-sigil">${String(index + 1).padStart(2, '0')}</span>
          <span><strong>${esc(titan)}</strong><small>${esc(first?.alignment || '')}</small></span>
        </button>`;
      }).join('');
    }

    function renderChapter() {
      const chapters = chaptersForTitan();
      const chapter = chapters[activeChapter] || chapters[0];
      if (!chapter) return;
      activeChapter = Math.max(0, chapters.indexOf(chapter));
      meta.textContent = `${chapter.era} · ${chapter.titan} · ${chapter.alignment}`;
      title.textContent = chapter.title;
      text.innerHTML = chapter.text.split(/\n{2,}/).map(paragraph => `<p>${esc(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
      progress.textContent = `${activeChapter + 1} / ${chapters.length}`;
      shell.querySelector('[data-direction="prev"]').disabled = activeChapter === 0;
      shell.querySelector('[data-direction="next"]').disabled = activeChapter === chapters.length - 1;
    }

    function selectEra(era) {
      activeEra = era;
      activeTitan = titansForEra()[0];
      activeChapter = 0;
      renderTabs(); renderRoster(); renderChapter();
    }

    shell.addEventListener('click', event => {
      const eraButton = event.target.closest('[data-era]');
      if (eraButton) { selectEra(eraButton.dataset.era); return; }
      const titanButton = event.target.closest('[data-titan]');
      if (titanButton) { activeTitan = titanButton.dataset.titan; activeChapter = 0; renderRoster(); renderChapter(); return; }
      const direction = event.target.closest('[data-direction]')?.dataset.direction;
      if (direction === 'prev' && activeChapter > 0) activeChapter--;
      else if (direction === 'next' && activeChapter < chaptersForTitan().length - 1) activeChapter++;
      else return;
      renderChapter();
    });
    shell.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const direction = event.key === 'ArrowLeft' ? 'prev' : 'next';
      shell.querySelector(`[data-direction="${direction}"]`)?.click();
    });

    selectEra(activeEra);
  } catch (error) {
    console.warn('泰坦颂诗交互档案加载失败，已保留普通文章：', error);
  }
}

// ===== 阿帽专区 =====
// 数据来自 data/wanderer.json / data/wanderer.en.json，正文原样取自 posts/wanderer-story.md。
// 界面文案一律用「阿帽」，章节正文保留原文中的历史称呼（那几章讲的就是他改名换姓的经历）。
const wandererData = { zh: null, en: null };
let wandererCurrent = null;   // 当前已渲染的数据，供名册/翻页处理器同步取用
let wandererChapter = 0;      // 当前章节索引（切语言时保持不变）

async function loadWanderer() {
  const lang = isEnglish() ? 'en' : 'zh';
  if (!wandererData[lang]) {
    const url = (lang === 'en' ? 'data/wanderer.en.json' : 'data/wanderer.json') + '?v=20260929a';
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    wandererData[lang] = await r.json();
  }
  return wandererData[lang];
}

function setWmText(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = value;
}

// 正文按空行分段，段内换行转 <br>，全部经 esc() 转义（与泰坦档案一致）
function wmParagraphs(src) {
  return String(src || '').split(/\n{2,}/).map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');
}

async function renderWanderer() {
  const page = document.getElementById('wanderer-page');
  if (!page) return;
  let data;
  try {
    data = await loadWanderer();
  } catch (e) {
    console.warn('阿帽专区数据加载失败：', e);
    if (!wandererCurrent) {
      const s = document.getElementById('wmScroll');
      if (s) s.innerHTML = '<div class="empty-state"><span class="empty-state-icon">' + ic('wind') + '</span><p>' + tr('loadFailed') + '</p></div>';
    }
    return;
  }
  wandererCurrent = data;

  // 主视觉
  setWmText('wmKicker', data.kicker);
  setWmText('wmTitle', data.title);
  setWmText('wmLatin', data.latin);
  setWmText('wmSubtitle', data.subtitle);
  setWmText('wmDesc', data.description);
  setWmText('wmCredit', data.hero && data.hero.credit ? 'Artwork · ' + data.hero.credit : '');
  const img = document.getElementById('wmHeroImg');
  if (img) img.alt = (data.hero && data.hero.alt) || '';
  const cap = page.querySelector('.wm-hero-caption');
  if (cap) cap.textContent = (data.hero && data.hero.caption) || '';

  // 翻页按钮文案
  const ui = data.ui || {};
  const prevLabel = document.querySelector('#wmPrev .wm-step-label');
  const nextLabel = document.querySelector('#wmNext .wm-step-label');
  if (prevLabel) prevLabel.textContent = ui.prev || '';
  if (nextLabel) nextLabel.textContent = ui.next || '';

  renderWandererRoster(data);
  renderWandererChapter(data);
  renderWandererChronicle(data);
  renderWandererScenes(data);
  renderWandererBonds(data);
  renderWandererQuotes(data);
  renderWandererConstellation(data);
  setTimeout(initReveal, 50);
}

// 数据里没有的区块整块隐藏，避免留一个空标题在页面上
function wmRevealBlock(id, hasContent) {
  const el = document.getElementById(id);
  if (el) el.hidden = !hasContent;
}

function renderWandererRoster(data) {
  const roster = document.getElementById('wmRoster');
  if (!roster) return;
  roster.innerHTML = (data.chapters || []).map((ch, i) =>
    `<button type="button" class="${i === wandererChapter ? 'active' : ''}" data-wm-chapter="${i}" aria-current="${i === wandererChapter ? 'true' : 'false'}">
      <span class="wm-sigil">${ic(ch.icon || 'wind')}</span>
      <span class="wm-roster-label">${esc(ch.label)}</span>
    </button>`).join('');
}

function renderWandererChapter(data) {
  const chapters = data.chapters || [];
  if (!chapters.length) return;
  wandererChapter = Math.min(Math.max(0, wandererChapter), chapters.length - 1);
  const ch = chapters[wandererChapter];
  setWmText('wmScrollTitle', ch.label);
  const sigil = document.getElementById('wmSigil');
  if (sigil) sigil.innerHTML = ic(ch.icon || 'wind');
  const text = document.getElementById('wmScrollText');
  if (text) text.innerHTML = wmParagraphs(ch.text);
  const prev = document.getElementById('wmPrev');
  const next = document.getElementById('wmNext');
  if (prev) prev.disabled = wandererChapter === 0;
  if (next) next.disabled = wandererChapter === chapters.length - 1;
  const prog = document.getElementById('wmProgress');
  if (prog) prog.textContent = (wandererChapter + 1) + ' / ' + chapters.length;
  // 名册高亮同步
  document.querySelectorAll('#wmRoster [data-wm-chapter]').forEach(b => {
    const on = Number(b.dataset.wmChapter) === wandererChapter;
    b.classList.toggle('active', on);
    b.setAttribute('aria-current', on ? 'true' : 'false');
  });
}

function renderWandererQuotes(data) {
  const grid = document.getElementById('wmQuoteGrid');
  if (!grid) return;
  setWmText('wmQuotesTitle', (data.sectionTitles || {}).quotes);
  grid.innerHTML = (data.quotes || []).map(q =>
    `<div class="wm-quote-card reveal">
      ${wmParagraphs(q.text)}
      <cite>${esc(q.label)}</cite>
    </div>`).join('');
}

function renderWandererConstellation(data) {
  const grid = document.getElementById('wmConstGrid');
  if (!grid) return;
  setWmText('wmConstTitle', (data.sectionTitles || {}).constellation);
  grid.innerHTML = ((data.constellation || {}).items || []).map(it =>
    `<div class="wm-const-card">
      <span class="wm-const-no">${esc(it.no)}</span>
      <span class="wm-const-name">${esc(it.name)}</span>
      <span class="wm-const-gloss">${esc(it.gloss)}</span>
    </div>`).join('');
}

// 纪行：按版本先后列出他登场过的篇目
function renderWandererChronicle(data) {
  const box = data.chronicle || {};
  const items = box.items || [];
  wmRevealBlock('wmChronBlock', items.length > 0);
  const list = document.getElementById('wmChronList');
  if (!list || !items.length) return;
  setWmText('wmChronTitle', box.title);
  setWmText('wmChronNote', box.note);
  list.innerHTML = items.map(it =>
    `<li class="wm-chron-item reveal">
      <span class="wm-chron-ver">${esc(it.ver)}</span>
      <div class="wm-chron-body">
        ${it.kind ? `<span class="wm-chron-kind">${esc(it.kind)}</span>` : ''}
        <h3 class="wm-chron-name">${esc(it.name)}</h3>
        <p class="wm-chron-text">${esc(it.text)}</p>
      </div>
    </li>`).join('');
}

// 名场面：具体场景 + 可选的当场台词
function renderWandererScenes(data) {
  const box = data.scenes || {};
  const items = box.items || [];
  wmRevealBlock('wmSceneBlock', items.length > 0);
  const grid = document.getElementById('wmSceneGrid');
  if (!grid || !items.length) return;
  setWmText('wmSceneTitle', box.title);
  grid.innerHTML = items.map(sc =>
    `<article class="wm-scene-card reveal">
      ${sc.where ? `<span class="wm-scene-where">${esc(sc.where)}</span>` : ''}
      <h3 class="wm-scene-name">${esc(sc.name)}</h3>
      <div class="wm-scene-text">${wmParagraphs(sc.text)}</div>
      ${sc.quote ? `<blockquote class="wm-scene-quote">${wmParagraphs(sc.quote)}</blockquote>` : ''}
    </article>`).join('');
}

// 羁绊：与他有过交集的人
function renderWandererBonds(data) {
  const box = data.bonds || {};
  const items = box.items || [];
  wmRevealBlock('wmBondBlock', items.length > 0);
  const grid = document.getElementById('wmBondGrid');
  if (!grid || !items.length) return;
  setWmText('wmBondTitle', box.title);
  grid.innerHTML = items.map(it =>
    `<div class="wm-bond-card reveal">
      ${it.rel ? `<span class="wm-bond-rel">${esc(it.rel)}</span>` : ''}
      <h3 class="wm-bond-name">${esc(it.name)}</h3>
      ${it.role ? `<span class="wm-bond-role">${esc(it.role)}</span>` : ''}
      <p class="wm-bond-text">${esc(it.text)}</p>
    </div>`).join('');
}

function stepWanderer(delta) {
  if (!wandererCurrent) return;
  const n = (wandererCurrent.chapters || []).length;
  const next = wandererChapter + delta;
  if (next < 0 || next >= n) return;
  wandererChapter = next;
  renderWandererChapter(wandererCurrent);
}

function initWanderer() {
  const page = document.getElementById('wanderer-page');
  if (!page) return;
  // 事件委托只需绑定一次；重复进入页面时靠 renderWanderer 刷新内容
  const scroll = document.getElementById('wmScroll');
  if (scroll && !scroll.dataset.wmBound) {
    scroll.dataset.wmBound = '1';
    scroll.addEventListener('click', e => {
      const dir = e.target.closest('[data-wm-direction]');
      if (dir) stepWanderer(dir.dataset.wmDirection === 'next' ? 1 : -1);
    });
    scroll.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      stepWanderer(e.key === 'ArrowRight' ? 1 : -1);
    });
  }
  const roster = document.getElementById('wmRoster');
  if (roster && !roster.dataset.wmBound) {
    roster.dataset.wmBound = '1';
    roster.addEventListener('click', e => {
      const btn = e.target.closest('[data-wm-chapter]');
      if (!btn || !wandererCurrent) return;
      wandererChapter = Number(btn.dataset.wmChapter) || 0;
      renderWandererChapter(wandererCurrent);
    });
  }
  renderWanderer();
}

// 背景意象：飘落羽毛（主）· 枫叶（次）· 风痕，铺在站内各页背景层
function initWandererAmbient() {
  const boxes = [document.getElementById('wmFloaters'), document.getElementById('wmHeroDrift')].filter(Boolean);
  if (!boxes.length) return;
  const kinds = [
    { cls: '', icon: 'feather', n: 5, min: 14, max: 26 },
    { cls: 'is-leaf', icon: 'maple', n: 3, min: 11, max: 20 },
    { cls: 'is-gust', icon: 'wind', n: 3, min: 22, max: 40 },
  ];
  boxes.forEach((box, boxIndex) => {
    const isHero = boxIndex === 1;   // hero 内数量减半，避免遮挡主视觉
    kinds.forEach(kind => {
      const count = isHero ? Math.max(2, Math.round(kind.n * 0.6)) : kind.n;
      for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'wm-floater' + (kind.cls ? ' ' + kind.cls : '');
        const size = kind.min + Math.random() * (kind.max - kind.min);
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.left = (Math.random() * 96) + '%';
        el.style.animationDuration = (26 + Math.random() * 34) + 's';
        el.style.animationDelay = (-Math.random() * 40) + 's';   // 负延迟让它们一开始就散布在途中
        el.innerHTML = ic(kind.icon);
        box.appendChild(el);
      }
    });
  });
}

function initReadingBar() {
  const bar = document.getElementById('readingProgress'); if (!bar) return;
  if (readingBarHandler) window.removeEventListener('scroll', readingBarHandler);
  const onScroll = () => {
    const a = document.querySelector('.post-article-body'); if (!a) return;
    const top = a.offsetTop - 100, h = a.scrollHeight - window.innerHeight + 100;
    bar.style.width = window.scrollY <= top ? '0%' : window.scrollY >= top + h ? '100%' : ((window.scrollY - top) / h * 100) + '%';
  };
  readingBarHandler = onScroll;
  window.addEventListener('scroll', readingBarHandler, { passive: true }); onScroll();
}

function cleanupArticleObservers() {
  if (readingBarHandler) {
    window.removeEventListener('scroll', readingBarHandler);
    readingBarHandler = null;
  }
  if (tocObserver) {
    tocObserver.disconnect();
    tocObserver = null;
  }
  const bar = document.getElementById('readingProgress');
  if (bar) bar.style.width = '0%';
}

// ===== Giscus =====
function mountGiscus(term, destId) {
  const dest = document.getElementById(destId);
  if (!dest) return;
  dest.innerHTML = '';
  const theme = 'https://giscus.app/themes/transparent_dark.css';
  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.setAttribute('data-repo', CONFIG.giscus.repo);
  s.setAttribute('data-repo-id', CONFIG.giscus.repoId);
  s.setAttribute('data-category', CONFIG.giscus.category);
  s.setAttribute('data-category-id', CONFIG.giscus.categoryId);
  s.setAttribute('data-mapping', 'specific');
  s.setAttribute('data-term', term);
  s.setAttribute('data-strict', '0');
  s.setAttribute('data-reactions-enabled', '1');
  s.setAttribute('data-emit-metadata', '0');
  s.setAttribute('data-input-position', 'bottom');
  s.setAttribute('data-theme', theme);
  s.setAttribute('data-lang', isEnglish() ? 'en' : 'zh-CN');
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

// ===== Home & List =====
function renderHomePosts() {
  const g = document.getElementById('homePostGrid'); if (!g) return;
  g.innerHTML = postMeta.slice(0, 7).map((raw, i) => {
    const p = postView(raw);
    const feat = i === 0;
    return `<article class="post-card${feat ? ' featured' : ''} reveal" data-post-id="${p.id}">
      ${feat ? '<span class="featured-badge">' + ic('star') + tr('featured') + '</span>' : ''}
      <div class="post-card-date">${ic('calendar')}${p.date}</div>
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
  if (!posts.length) { l.innerHTML = '<div class="empty-state"><span class="empty-state-icon">' + ic('search') + '</span><p>' + tr('noPosts') + '</p></div>'; return; }
  l.innerHTML = posts.map(raw => { const p = postView(raw); return `<article class="post-list-item reveal" data-post-id="${p.id}">
    <div class="post-list-date">${p.date}</div>
    <div class="post-list-content">
      <h3 class="post-list-title">${esc(p.title)}</h3>
      <p class="post-list-summary">${esc(p.summary)}</p>
      <div class="post-list-meta">${ic('book')}${tr('minuteRead', { count: Math.max(1, Math.ceil((p.wordCount || p.summary.length) / 400)) })}</div>
      <div class="post-list-tags" style="margin-top:.3rem">${p.tags.map(t => `<span class="post-card-tag">${esc(t)}</span>`).join('')}</div>
    </div></article>`; }).join('');
}

// ===== 全文搜索 =====
function stripMarkdown(src) {
  // 排除 frontmatter 与 fenced code（散文/诗词站点搜正文更干净）
  let s = String(src || '').replace(/^---[\s\S]*?---/, '');
  s = s.replace(/```[\s\S]*?```/g, ' ');
  s = s.replace(/`([^`]*)`/g, '$1');
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/^\s*>\s?/gm, '');
  s = s.replace(/^\s*[-+*]\s+/gm, ' ');
  s = s.replace(/^\s*\d+\.\s+/gm, ' ');
  s = s.replace(/\|/g, ' ');
  s = s.replace(/[*_~]+/g, '');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return normalize(s);
}
function normalize(text) {
  return String(text || '').toLowerCase().replace(/　/g, ' ').replace(/\s+/g, ' ').trim();
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
async function ensureSearchIndex() {
  // postMeta 可能晚于首次搜索才加载完，索引不完整时重建
  if (searchIndexPromise && postMeta.length && searchBody.size < postMeta.length) searchIndexPromise = null;
  if (searchIndexPromise) return searchIndexPromise;
  searchIndexPromise = (async () => {
    await Promise.all(postMeta.map(async p => {
      if (!postCache[p.id]) {
        const r = await fetch('posts/' + p.filename);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        postCache[p.id] = await r.text();
      }
      if (!postCacheEn[p.id]) {
        const er = await fetch('posts/en/' + p.filename);
        if (er.ok) postCacheEn[p.id] = await er.text();
      }
      searchBody.set(p.id, stripMarkdown(postCache[p.id] + '\n' + (postCacheEn[p.id] || '')));
    }));
    updateHeroStats();
  })();
  try { await searchIndexPromise; } catch (e) { searchIndexPromise = null; throw e; }
}
function searchPosts(q) {
  const tokens = normalize(q).split(/\s+/).filter(Boolean);
  if (!tokens.length) return Promise.resolve([]);
  return ensureSearchIndex().then(() => {
    const results = [];
    postMeta.forEach(p => {
      const body = searchBody.get(p.id) || '';
      const view = postView(p);
      const titleN = normalize(p.title + ' ' + view.title);
      const tagN = (p.tags.join(' ') + ' ' + view.tags.join(' ')).toLowerCase();
      const sumN = normalize((p.summary || '') + ' ' + (view.summary || ''));
      let score = 0;
      const fields = [];
      tokens.forEach(t => {
        if (titleN.includes(t)) { score += 100; fields.push(tr('fieldsTitle')); if (titleN === t) score += 15; }
        if (tagN.includes(t)) { score += 60; fields.push(tr('fieldsTags')); }
        if (sumN.includes(t)) { score += 30; fields.push(tr('fieldsSummary')); }
        let n = 0, idx = body.indexOf(t);
        while (idx !== -1 && n < 8) { n++; idx = body.indexOf(t, idx + t.length); }
        score += n * 8;
        if (n > 0) fields.push(tr('fieldsBody'));
      });
      if (score > 0) {
        results.push({
          id: p.id, title: view.title, date: p.date, tags: view.tags, score,
          snippet: buildSnippet(body, tokens),
          fields: [...new Set(fields)],
        });
      }
    });
    results.sort((a, b) => (b.score - a.score) || (b.date < a.date ? -1 : 1));
    return results.slice(0, 8);
  });
}
function buildSnippet(text, tokens, win) {
  win = win || 80;
  const n = normalize(text);
  let anchor = -1;
  for (const t of tokens) { const i = n.indexOf(t); if (i !== -1) { anchor = i; break; } }
  if (anchor === -1) return escapeHtml(n.slice(0, 120));
  const start = Math.max(0, anchor - win), end = Math.min(n.length, anchor + win);
  let html = escapeHtml(n.slice(start, end));
  tokens.forEach(t => {
    if (!t) return;
    html = html.replace(new RegExp(escapeRegex(t), 'gi'), m => '<mark>' + m + '</mark>');
  });
  return (start > 0 ? '…' : '') + html + (end < n.length ? '…' : '');
}
function renderBodySearch(results, q) {
  const box = document.getElementById('bodySearchResults');
  if (!box) return;
  box.innerHTML = results.length
    ? results.map(r => `<article class="body-hit" data-post-id="${r.id}">
        <div class="body-hit-title">${escapeHtml(r.title)}</div>
        <div class="body-hit-snippet">${r.snippet}</div>
        <div class="body-hit-meta"><span>${ic('book')}${escapeHtml(r.fields.join(' · '))}</span><span>${ic('calendar')}${escapeHtml(r.date)}</span></div>
      </article>`).join('')
    : `<div class="search-empty">${escapeHtml(tr('noResult', { query: q }))}</div>`;
}
function clearBodySearch() {
  searchSeq++;
  const box = document.getElementById('bodySearchResults');
  if (box) box.innerHTML = '';
  const list = document.getElementById('postList');
  if (list) list.style.display = '';
}
// 文章渲染完成后，高亮跳转前携带的搜索词（跳过 pre/code/a/标题）
function highlightInArticle() {
  if (!pendingHighlight || !pendingHighlight.length) return;
  const body = document.querySelector('.post-article-body');
  if (!body) return;
  const tokens = pendingHighlight;
  pendingHighlight = null;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.parentElement && n.parentElement.closest('pre, code, a, h1, h2, h3, h4, h5, h6, .heading-anchor')) continue;
    textNodes.push(n);
  }
  textNodes.forEach(n => {
    const rest = n.nodeValue;
    if (!rest || !tokens.some(t => t && rest.toLowerCase().includes(t))) return;
    const frag = document.createDocumentFragment();
    let remaining = rest;
    while (remaining) {
      let idx = -1, len = 0;
      tokens.forEach(t => {
        if (!t) return;
        const i = remaining.toLowerCase().indexOf(t);
        if (i !== -1 && (idx === -1 || i < idx)) { idx = i; len = t.length; }
      });
      if (idx === -1) { frag.appendChild(document.createTextNode(remaining)); break; }
      if (idx > 0) frag.appendChild(document.createTextNode(remaining.slice(0, idx)));
      const mark = document.createElement('mark');
      mark.className = 'hl';
      mark.textContent = remaining.slice(idx, idx + len);
      frag.appendChild(mark);
      remaining = remaining.slice(idx + len);
    }
    n.parentNode.replaceChild(frag, n);
  });
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
      const list = document.getElementById('postList');
      // 有正文搜索词时隐藏网格，避免与面板空态重复；无词时恢复
      if (list) list.style.display = q ? 'none' : '';
      if (!q) {
        renderPostList(postMeta.filter(p => tag === 'all' || p.tags.includes(tag)));
      }
      // 正文全文搜索面板（seq 防过期覆盖）
      const seq = ++searchSeq;
      const box = document.getElementById('bodySearchResults');
      if (!box) return;
      if (q) {
        box.innerHTML = '<div class="search-loading">' + tr('loadingSearch') + '</div>';
        searchPosts(q).then(results => {
          if (seq !== searchSeq) return;
          renderBodySearch(results, q);
        }).catch(e => {
          if (seq !== searchSeq) return;
          box.innerHTML = '<div class="search-empty">' + tr('searchFailed') + '</div>';
          console.warn('全文搜索失败：', e);
        });
      } else {
        clearBodySearch();
      }
    }, 200);
  });
}
function initTagFilter() {
  const all = new Set(); postMeta.forEach(p => p.tags.forEach(t => all.add(t)));
  const fc = document.getElementById('tagFilter'); if (!fc) return;
  fc.innerHTML = ['all', ...[...all].sort()].map(t => `<button class="tag-btn${t === 'all' ? ' active' : ''}" data-tag="${t}">${t === 'all' ? ic('tag') + tr('all') : esc(tagView(t))}</button>`).join('');
  if (fc.dataset.bound) return;
  fc.dataset.bound = 'true';
  fc.addEventListener('click', e => {
    if (!e.target.classList.contains('tag-btn')) return;
    const tag = e.target.dataset.tag;
    window.location.hash = tag === 'all' ? '#blog' : '#tag/' + encodeURIComponent(tag);
  });
}

// ===== Typewriter (Hero) =====
let typewriterRun = 0;
function initTypewriter() {
  const el = document.getElementById('heroTypewriter'); if (!el) return;
  const run = ++typewriterRun;
  el.textContent = '';
  const phrases = isEnglish()
    ? ['Wine and osmanthus I would share—yet the young days cannot return.', 'We are made of stardust, and to the stars we shall return.', 'Building worlds with code, salvaging time with words.', 'Genshin Impact · Honkai: Star Rail · Creative Writing', 'The journey itself is the answer.', 'Seeking finite answers in infinite stories.', 'Moving forward brings no loss, only new encounters.', 'No freedom is absolute; even the wind must one day reach its end.']
    : ['欲买桂花同载酒，终不似，少年游', '我们由星辰所造，终将归于星辰', '用代码构筑世界，以文字打捞时间', '原神 · 星穹铁道 · 文学创作', '旅途本身就是答案', '在无限的故事里，寻找有限的答案', '前行不会带来失去，但会带来相遇', '这世上没有纯粹的自由，风也有吹到头的时候'];
  let pi = 0, ci = 0, del = false, pause = false;
  const tick = () => {
    if (!el || run !== typewriterRun) return;
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
    const r = await fetch(isEnglish() ? 'data/timeline.en.json' : 'data/timeline.json'); const entries = await r.json();
    if (!entries.length) { c.innerHTML = '<div class="empty-state"><span class="empty-state-icon">' + ic('clock') + '</span><p>' + tr('noUpdates') + '</p></div>'; return; }
    const lbl = isEnglish()
      ? { post: ic('book') + 'Post', github: ic('github') + 'GitHub', milestone: ic('flag') + 'Milestone', note: ic('pen') + 'Note' }
      : { post: ic('book') + '文章', github: ic('github') + 'GitHub', milestone: ic('flag') + '里程碑', note: ic('pen') + '笔记' };
    c.innerHTML = entries.map(e => `<div class="timeline-item reveal">
      <div class="timeline-date">${esc(e.date)}</div>
      <div class="timeline-title">
        ${e.link ? `<a href="${esc(e.link)}" ${e.link.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${esc(e.title)}</a>` : esc(e.title)}
        <span class="timeline-type-badge tbadge-${esc(e.type)}">${lbl[e.type] || e.type}</span>
      </div>
      ${e.description ? `<div class="timeline-desc">${esc(e.description)}</div>` : ''}
    </div>`).join('');
    setTimeout(initReveal, 50);
  } catch (e) { console.warn('加载时间线失败：', e); c.innerHTML = '<div class="empty-state"><span class="empty-state-icon">' + ic('x') + '</span><p>' + tr('loadFailed') + '</p></div>'; }
}

// ===== Guestbook =====
function renderGuestbook() {
  const c = document.getElementById('guestbookMessages'); if (!c) return;
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const card = m => `<div class="guestbook-card reveal">
    <div class="guestbook-avatar">${initial(m.name)}</div>
    <div class="guestbook-body">
      <div class="guestbook-name">${esc(m.name)}<span class="guestbook-date">${esc(m.date)}</span></div>
      <div class="guestbook-message">${esc(m.message)}</div>
    </div></div>`;
  fetch('data/guestbook.json').then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(msgs => {
    if (!msgs.length) { c.innerHTML = '<div class="empty-state"><span class="empty-state-icon">' + ic('message') + '</span><p>' + tr('noMessages') + '</p></div>'; return; }
    const draw = () => {
      // 随机抽取至少一条（最多 3 条），每次进入页面/点「换一批」都会变化
      const n = Math.min(3, msgs.length);
      const picked = shuffle(msgs).slice(0, n);
      c.innerHTML = '<div class="guestbook-random-head"><span class="guestbook-random-label">' + ic('message') + tr('randomMessages') + '</span><button type="button" class="guestbook-shuffle">' + ic('refresh') + tr('shuffle') + '</button></div>' + picked.map(card).join('');
      setTimeout(initReveal, 50);
      c.querySelector('.guestbook-shuffle')?.addEventListener('click', draw);
    };
    draw();
  }).catch(e => {
    console.warn('加载留言数据失败：', e);
    c.innerHTML = '<div class="empty-state"><span class="empty-state-icon">' + ic('x') + '</span><p>' + tr('loadFailed') + '</p></div>';
  });
  // Giscus provides the input form
  loadGuestbookGiscus();
}
function loadGuestbookGiscus() { mountGiscus('guestbook', 'guestbook-giscus'); }
function initial(name) {
  const ch = (name && name.trim().charAt(0)) || (isEnglish() ? 'G' : '访');
  return '<span class="gb-initial">' + esc(ch) + '</span>';
}

// ===== Reveal =====
function initReveal() {
  document.querySelectorAll('.reveal').forEach(el => {
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const parent = el.parentElement;
        const siblings = parent ? Array.from(parent.children) : [el];
        const idx = Math.min(siblings.indexOf(el), 8);
        el.style.transitionDelay = (idx * 55) + 'ms';
        el.classList.add('visible');
        ob.disconnect();
        setTimeout(() => { el.style.transitionDelay = ''; }, 650);
      }
    }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
    ob.observe(el);
  });
}

// ===== 卡片 3D 倾斜 + 光斑跟随光标 =====
function initTilt() {
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const sel = '.post-card, .related-card, .glass-card';
  document.addEventListener('mousemove', e => {
    const card = e.target.closest(sel);
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', (px * 100) + '%');
    card.style.setProperty('--my', (py * 100) + '%');
    if (card.classList.contains('post-card') || card.classList.contains('related-card')) {
      const rx = (0.5 - py) * 7;
      const ry = (px - 0.5) * 7;
      card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-2px)';
    }
  });
  document.addEventListener('mouseout', e => {
    const card = e.target.closest(sel);
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  });
}

// ===== 鼠标效果：暖金圆点即时跟随 + 光环缓动拖尾 =====
function initCursor() {
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;
  let mx = -100, my = -100, rx = -100, ry = -100, shown = false;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = (mx - 4) + 'px';
    dot.style.top = (my - 4) + 'px';
    if (!shown) { shown = true; dot.classList.add('on'); ring.classList.add('on'); }
  });
  // 悬停可交互元素时光环放大（金色描边）
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a, button, [data-page], .post-card, .related-card, .tag-btn, .cmd-item, .nav-link')) ring.classList.add('grow');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a, button, [data-page], .post-card, .related-card, .tag-btn, .cmd-item, .nav-link')) ring.classList.remove('grow');
  });
  (function animateRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.left = (rx - 18) + 'px';
    ring.style.top = (ry - 18) + 'px';
    requestAnimationFrame(animateRing);
  })();
}

// ===== Hero 视差（粒子层随鼠标移动） =====
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  const particles = document.querySelector('.hero-particles');
  if (!hero || !particles) return;
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    particles.style.transform = 'translate(' + (x * 26) + 'px,' + (y * 18) + 'px)';
  });
  hero.addEventListener('mouseleave', () => { particles.style.transform = ''; });
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
  const setOpen = open => {
    nav.classList.toggle('open', open);
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? (isEnglish() ? 'Close menu' : '关闭菜单') : (isEnglish() ? 'Open menu' : '打开菜单'));
  };
  btn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.addEventListener('click', e => { if (e.target.classList.contains('nav-link')) setOpen(false); });
  document.addEventListener('click', e => { if (!btn.contains(e.target) && !nav.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
}

// ===== Code copy =====
function addCopyBtns() {
  document.querySelectorAll('.post-article-body pre').forEach(pre => {
    if (pre.querySelector('.copy-code-btn')) return;
    // 语言标识：从 <code class="language-xxx"> 提取并标到 pre 上
    const codeEl = pre.querySelector('code');
    const lm = codeEl && (codeEl.className.match(/\blanguage-([\w+-]+)/) || codeEl.className.match(/\blang-([\w+-]+)/));
    if (lm) { pre.classList.add('has-lang'); pre.dataset.lang = lm[1]; }
    const btn = document.createElement('button'); btn.className = 'copy-code-btn'; btn.innerHTML = ic('copy') + tr('copy');
    btn.onclick = async () => {
      const code = pre.querySelector('code'); if (!code) return;
      try { await navigator.clipboard.writeText(code.textContent); btn.innerHTML = ic('check'); btn.classList.add('copied'); toast(tr('copied')); setTimeout(() => { btn.innerHTML = ic('copy') + tr('copy'); btn.classList.remove('copied'); }, 2000); } catch (e) { console.warn('复制失败：', e); toast(tr('copyFailed')); }
    };
    pre.appendChild(btn);
  });
}

function lazyLoadImages(root) {
  root.querySelectorAll('.post-article-body img').forEach(img => { img.loading = 'lazy'; img.decoding = 'async'; });
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
function ic(name) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }

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
        span.innerHTML = ic('eye') + data.count;
        meta.appendChild(span);
      }
    }
  } catch (e) { console.warn('浏览量加载失败：', e); }
}

// ===== Bottle =====
let bottleReady = false;
function initBottle() {
  if (bottleReady) return; // 只初始化一次，避免重复绑定监听器
  bottleReady = true;
  // Tab switching
  const tabs = document.querySelectorAll('.bottle-tab');
  const panels = { throw: document.getElementById('throwPanel'), pick: document.getElementById('pickPanel') };
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      t.classList.add('active');
      Object.values(panels).forEach(p => p?.classList.remove('active'));
      const panel = panels[t.dataset.bottleTab];
      if (panel) panel.classList.add('active');
    });
  });

  // Character counter
  const msgEl = document.getElementById('bottleMessage');
  const countEl = document.getElementById('bottleCharCount');
  if (msgEl && countEl) {
    msgEl.addEventListener('input', () => { countEl.textContent = msgEl.value.length; });
  }

  // Throw button
  const throwBtn = document.getElementById('throwBtn');
  if (throwBtn) {
    throwBtn.addEventListener('click', throwBottle);
  }

  // Pick button
  const pickBtn = document.getElementById('pickBtn');
  if (pickBtn) {
    pickBtn.addEventListener('click', pickBottle);
  }

  // Fetch bottle count
  fetchBottleCount();
}

async function fetchBottleCount() {
  try {
    const r = await fetch('php/bottle.php?action=count');
    const data = await r.json();
    const el = document.getElementById('bottleCount');
    if (el && data.ok) el.textContent = data.count;
  } catch (e) { console.warn('获取瓶子数失败：', e); }
}

async function throwBottle() {
  const name = document.getElementById('bottleName').value.trim();
  const message = document.getElementById('bottleMessage').value.trim();
  const url = document.getElementById('bottleUrl').value.trim();
  const fb = document.getElementById('throwFeedback');
  const btn = document.getElementById('throwBtn');

  if (!name) { fb.innerHTML = '<span style="color:#ef4444;">' + tr('needName') + '</span>'; return; }
  if (!message) { fb.innerHTML = '<span style="color:#ef4444;">' + tr('needMessage') + '</span>'; return; }

  btn.disabled = true;
  btn.textContent = tr('bottleThrowing');
  fb.innerHTML = '';

  try {
    const r = await fetch('php/bottle.php?action=throw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message, url }),
    });
    const data = await r.json();
    if (data.ok) {
      fb.innerHTML = '<span style="color:#10b981;">' + ic('check') + ' ' + esc(isEnglish() ? 'Your bottle is now adrift.' : data.message) + '</span>';
      document.getElementById('bottleName').value = '';
      document.getElementById('bottleMessage').value = '';
      document.getElementById('bottleUrl').value = '';
      document.getElementById('bottleCharCount').textContent = '0';
      fetchBottleCount();
    } else {
      fb.innerHTML = '<span style="color:#ef4444;">' + ic('x') + ' ' + esc(data.message) + '</span>';
    }
  } catch (e) {
    console.warn('投瓶失败：', e);
    fb.innerHTML = '<span style="color:#ef4444;">' + tr('networkError') + '</span>';
  }

  btn.disabled = false;
  btn.innerHTML = ic('send') + tr('bottleThrow');
}

async function pickBottle() {
  const result = document.getElementById('pickResult');
  const btn = document.getElementById('pickBtn');
  const fb = document.getElementById('pickFeedback');

  // #pickBtn / #pickFeedback 常驻，捞瓶结果只更新 #pickResult，避免重建按钮导致监听器失效
  btn.disabled = true;
  btn.textContent = tr('bottlePicking');
  fb.innerHTML = '';

  try {
    const r = await fetch('php/bottle.php?action=pick');
    const data = await r.json();
    if (data.ok && data.bottle) {
      const b = data.bottle;
      result.innerHTML = `
        <div class="bottle-pick-emoji">${ic('bottle')}</div>
        <div class="bottle-pick-message">${esc(b.message)}</div>
        ${b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener" class="bottle-pick-url">${ic('link')}${esc(b.url)}</a>` : ''}
        <div class="bottle-pick-meta">
          <span>— ${esc(b.name)}</span>
          <span>${esc(b.date)}</span>
        </div>`;
    } else {
      result.innerHTML = `
        <div class="bottle-pick-emoji">${ic('bottle')}</div>
        <p style="color:var(--text2);margin-bottom:1.25rem;">${esc(isEnglish() ? tr('emptySea') : (data.message || tr('emptySea')))}</p>`;
    }
  } catch (e) {
    console.warn('捞瓶失败：', e);
    fb.innerHTML = '<span style="color:#ef4444;">' + tr('networkError') + '</span>';
  } finally {
    btn.disabled = false;
    btn.innerHTML = ic('anchor') + tr('bottlePick');
  }
}

// ===== Lightbox（文章图片放大预览） =====
let lightboxEl = null;
function initLightbox() {
  document.addEventListener('click', e => {
    const img = e.target.closest('.post-article-body img');
    if (!img || img.closest('a')) return; // 图片本身是链接时不拦截
    openLightbox(img.src, img.alt || '');
  });
}
function openLightbox(src, alt) {
  if (!lightboxEl) {
    lightboxEl = document.createElement('div');
    lightboxEl.className = 'lightbox';
    lightboxEl.innerHTML = '<button class="lightbox-close" aria-label="' + (isEnglish() ? 'Close' : '关闭') + '">✕</button><figure class="lightbox-figure"><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lightboxEl);
    lightboxEl.addEventListener('click', e => {
      if (e.target === lightboxEl || e.target.classList.contains('lightbox-close')) closeLightbox();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
  }
  const img = lightboxEl.querySelector('img');
  img.src = src; img.alt = alt;
  const cap = lightboxEl.querySelector('figcaption');
  cap.textContent = alt;
  document.body.classList.add('no-scroll');
  lightboxEl.classList.add('open');
}
function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('open');
  document.body.classList.remove('no-scroll');
}

// ===== ⌘K 命令面板 =====
const cmdKCommands = [
  { id: 'home', label: '首页', sub: '返回首页', enLabel: 'Home', enSub: 'Return home', icon: 'home', action: () => { window.location.hash = '#home'; } },
  { id: 'blog', label: '文章', sub: '浏览全部文章', enLabel: 'Posts', enSub: 'Browse all posts', icon: 'book', action: () => { window.location.hash = '#blog'; } },
  { id: 'timeline', label: '动态', sub: '博客更新时间线', enLabel: 'Updates', enSub: 'Archive update timeline', icon: 'clock', action: () => { window.location.hash = '#timeline'; } },
  { id: 'guestbook', label: '留言板', sub: '留言交流', enLabel: 'Guestbook', enSub: 'Read and leave messages', icon: 'message', action: () => { window.location.hash = '#guestbook'; } },
  { id: 'bottle', label: '漂流瓶', sub: '扔一个 / 捞一个瓶子', enLabel: 'Drift Bottle', enSub: 'Cast or retrieve a bottle', icon: 'bottle', action: () => { window.location.hash = '#bottle'; } },
  { id: 'about', label: '关于', sub: '关于我', enLabel: 'About', enSub: 'About me', icon: 'user', action: () => { window.location.hash = '#about'; } },
  { id: 'wanderer', label: '阿帽', sub: '进入阿帽专区', enLabel: 'Hat Guy', enSub: 'Enter the Hat Guy archive', icon: 'hat', action: () => { window.location.hash = '#wanderer'; } },
  { id: 'download', label: '下载中心', sub: '打开下载页面', enLabel: 'Downloads', enSub: 'Open the downloads page', icon: 'download', action: () => { window.location.href = 'download.php'; } },
  { id: 'reader', label: '在线阅读', sub: '打开书籍阅读器', enLabel: 'Reader', enSub: 'Open the book reader', icon: 'book', action: () => { window.location.href = 'reader.php'; } },
  { id: 'top', label: '回到顶部', sub: '滚动到页面顶部', enLabel: 'Back to Top', enSub: 'Scroll to the top', icon: 'chevron', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); } },
];
let cmdKOpen = false, cmdKActive = -1, cmdKItems = [], cmdKLastFocus = null;

function initCommandPalette() {
  const panel = document.getElementById('cmdK');
  const input = document.getElementById('cmdKInput');
  const list = document.getElementById('cmdKList');
  const trigger = document.getElementById('cmdKTrigger');
  if (!panel || !input || !list) return;

  // 快捷键：Ctrl/Cmd+K 切换；"/" 打开（避开输入态）
  document.addEventListener('keydown', e => {
    if (e.isComposing || e.keyCode === 229) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); // Chrome 默认聚焦地址栏，必须拦截
      cmdKOpen ? closeCommandPalette() : openCommandPalette();
    } else if (e.key === '/' && !cmdKOpen && !isEditableTarget(e.target)) {
      e.preventDefault();
      openCommandPalette();
    }
  });
  if (trigger) trigger.addEventListener('click', () => (cmdKOpen ? closeCommandPalette() : openCommandPalette()));
  panel.addEventListener('click', e => { if (e.target.closest('[data-cmdk-close]')) closeCommandPalette(); });

  input.addEventListener('input', () => { cmdKActive = -1; renderCmdK(input.value); });
  input.addEventListener('keydown', e => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); moveCmdK(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveCmdK(-1); }
    else if (e.key === 'Home') { e.preventDefault(); cmdKActive = 0; highlightCmdK(); }
    else if (e.key === 'End') { e.preventDefault(); cmdKActive = cmdKItems.length - 1; highlightCmdK(); }
    else if (e.key === 'Enter') { e.preventDefault(); runCmdK(); }
    else if (e.key === 'Escape') { closeCommandPalette(); }
  });
  // 焦点陷阱：面板内唯一可聚焦元素是输入框
  panel.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); input.focus(); } });
  // 点击项执行
  list.addEventListener('mousedown', e => {
    const item = e.target.closest('.cmd-item');
    if (!item) return;
    const idx = cmdKItems.findIndex(i => String(i.id) === item.dataset.id);
    if (idx !== -1) { cmdKActive = idx; highlightCmdK(); runCmdK(); }
  });

  renderCmdK('');
}

function openCommandPalette() {
  const panel = document.getElementById('cmdK');
  if (!panel || cmdKOpen) return;
  cmdKOpen = true;
  cmdKLastFocus = document.activeElement;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  const input = document.getElementById('cmdKInput');
  input.setAttribute('aria-expanded', 'true');
  setTimeout(() => input.focus(), 30);
  setCmdKInert(true);
  document.body.classList.add('no-scroll');
  closeLightbox();
  renderCmdK(input.value);
}
function closeCommandPalette() {
  const panel = document.getElementById('cmdK');
  if (!panel || !cmdKOpen) return;
  cmdKOpen = false;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  const input = document.getElementById('cmdKInput');
  if (input) input.setAttribute('aria-expanded', 'false');
  setCmdKInert(false);
  document.body.classList.remove('no-scroll');
  if (cmdKLastFocus && cmdKLastFocus.focus) cmdKLastFocus.focus();
}
function setCmdKInert(on) {
  if (!('inert' in HTMLElement.prototype)) return;
  ['app', 'bottomNav'].forEach(id => { const el = document.getElementById(id); if (el) el.inert = on; });
  document.querySelectorAll('.site-header, .site-footer').forEach(el => { el.inert = on; });
}
function renderCmdK(q) {
  const list = document.getElementById('cmdKList');
  if (!list) return;
  const qn = normalize(q);
  const commandText = c => isEnglish() ? { label: c.enLabel, sub: c.enSub } : { label: c.label, sub: c.sub };
  const cmds = qn
    ? cmdKCommands.filter(c => { const v = commandText(c); return normalize(v.label + v.sub).includes(qn); })
    : cmdKCommands;
  cmdKItems = cmds.map(c => { const v = commandText(c); return { id: c.id, kind: 'cmd', label: v.label, sub: v.sub, icon: c.icon }; });
  cmdKActive = -1;
  renderCmdKList();
  if (qn) {
    searchPosts(q).then(results => {
      if (!cmdKOpen) return;
      const input = document.getElementById('cmdKInput');
      if (!input || normalize(input.value) !== qn) return; // 已输入新词，丢弃过期结果
      const posts = results.map(r => ({ id: r.id, kind: 'post', label: r.title, sub: r.date + ' · ' + r.fields.join('/'), icon: 'book', tags: r.tags }));
      cmdKItems = [...cmdKItems, ...posts];
      cmdKActive = -1;
      renderCmdKList();
    }).catch(() => {});
  }
}
function renderCmdKList() {
  const list = document.getElementById('cmdKList');
  if (!list) return;
  if (!cmdKItems.length) { list.innerHTML = '<li class="cmd-k-empty">' + (isEnglish() ? 'No matches' : '没有匹配项') + '</li>'; return; }
  list.innerHTML = cmdKItems.map((it, i) => {
    const tags = it.kind === 'post' && it.tags && it.tags.length
      ? '<span class="cmdi-tags">' + it.tags.slice(0, 2).map(t => '<span class="post-card-tag">' + escapeHtml(t) + '</span>').join('') + '</span>' : '';
    return '<li class="cmd-item" role="option" id="cmd-opt-' + i + '" data-id="' + it.id + '" data-kind="' + it.kind + '" aria-selected="' + (i === cmdKActive ? 'true' : 'false') + '">' +
      '<span class="cmdi-ic">' + ic(it.icon) + '</span>' +
      '<span class="cmdi-main"><span class="cmdi-title">' + escapeHtml(it.label) + tags + '</span>' +
      '<span class="cmdi-sub">' + escapeHtml(it.sub) + '</span></span></li>';
  }).join('');
}
function moveCmdK(delta) {
  if (!cmdKItems.length) return;
  cmdKActive = (cmdKActive + delta + cmdKItems.length) % cmdKItems.length;
  highlightCmdK();
}
function highlightCmdK() {
  const list = document.getElementById('cmdKList');
  const opts = list.querySelectorAll('.cmd-item');
  opts.forEach((o, i) => {
    const sel = i === cmdKActive;
    o.setAttribute('aria-selected', sel ? 'true' : 'false');
    o.classList.toggle('active', sel);
  });
  const active = opts[cmdKActive];
  if (active) active.scrollIntoView({ block: 'nearest' });
  const input = document.getElementById('cmdKInput');
  if (input) input.setAttribute('aria-activedescendant', cmdKActive >= 0 ? 'cmd-opt-' + cmdKActive : '');
}
function runCmdK() {
  if (cmdKActive < 0 || !cmdKItems[cmdKActive]) return;
  const it = cmdKItems[cmdKActive];
  closeCommandPalette(); // 先关面板再导航，避免 View Transitions 快照冻结面板
  if (it.kind === 'post') {
    const q = (document.getElementById('cmdKInput') || {}).value || '';
    pendingHighlight = q ? normalize(q).split(/\s+/).filter(Boolean) : null;
    window.location.hash = '#post/' + it.id;
    return;
  }
  const cmd = cmdKCommands.find(c => c.id === it.id);
  if (cmd) cmd.action();
}
function isEditableTarget(el) {
  const t = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  return !!t;
}

// ===== TOC & Related Posts =====
function slugify(text) {
  let slug = text
    .replace(/[^\w一-鿿぀-ゟ゠-ヿ-]+/g, '-')
    .replace(/^-+|-+$/g, '').toLowerCase().replace(/-+/g, '-');
  return slug || 'heading';
}
function buildToc() {
  const body = isEnglish() ? document.querySelector('.article-language-en') : document.querySelector('.post-article-body');
  if (!body) return '';
  const headings = body.querySelectorAll('h2, h3');
  if (headings.length < 2) return '';
  let html = '<div class="toc-container glass-card"><a href="#blog" class="toc-back" data-page="blog" style="display:block;font-size:.82rem;margin-bottom:.6rem;color:var(--accent);text-decoration:none;font-weight:500">' + tr('backToPosts') + '</a><div class="toc-header">' +
    '<span>' + tr('toc') + '</span>';
  // Only show toggle button in the sidebar variant (CSS hides it on desktop)
  html += '<button class="toc-toggle" type="button">' + tr('expand') + '</button>';
  html += '</div><nav class="toc-list">';
  headings.forEach(h => {
    const level = h.tagName === 'H2' ? 'toc-h2' : 'toc-h3';
    // 标题里可能注入了 .heading-anchor（文本 "#"），读取时剥离
    const title = h.cloneNode(true);
    title.querySelector('.heading-anchor')?.remove();
    html += '<a class="toc-link ' + level + '" href="#" data-toc-target="' + h.id + '">' + esc(title.textContent) + '</a>';
  });
  html += '</nav></div>';
  return html;
}
// ===== TOC 滚动高亮（scrollspy） =====
function initScrollspy() {
  if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
  const links = document.querySelectorAll('.toc-link');
  if (!links.length) return;
  const headings = Array.from(links).map(l => document.getElementById(l.dataset.tocTarget)).filter(Boolean);
  if (!headings.length) return;
  tocObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(l => l.classList.toggle('active', l.dataset.tocTarget === en.target.id));
    });
  }, { rootMargin: '-70px 0px -65% 0px', threshold: 0 });
  headings.forEach(h => tocObserver.observe(h));
}
function getRelatedPosts(currentId, limit) {
  const current = postMeta.find(p => p.id === currentId);
  if (!current || !current.tags || !current.tags.length) return [];
  return postMeta.filter(p => p.id !== currentId).map(p => ({ ...p, sharedCount: p.tags.filter(t => current.tags.includes(t)).length })).filter(p => p.sharedCount > 0).sort((a, b) => b.sharedCount - a.sharedCount).slice(0, limit);
}
function renderRelatedPosts(posts, currentTags) {
  if (!posts.length) return '';
  return '<div class="related-section reveal"><h3 class="related-title">' + ic('heart') + tr('related') + '</h3><div class="related-grid">' +
    posts.map(raw => {
      const sharedSourceTags = currentTags ? raw.tags.filter(t => currentTags.includes(t)) : raw.tags;
      const p = postView(raw);
      const sharedTags = sharedSourceTags.map(t => p.tags[raw.tags.indexOf(t)] || t);
      return '<article class="related-card reveal" data-post-id="' + p.id + '"><h4 class="related-card-title">' + esc(p.title) + '</h4><div class="related-card-tags">' + sharedTags.map(t => '<span class="post-card-tag">' + esc(t) + '</span>').join('') + '</div></article>';
    }).join('') + '</div></div>';
}
