/**
 * 在线阅读器 — 连续滚动模式
 *   TXT ：滚动到底自动加载下一段（20KB/块），进度自动记忆
 *   EPUB：epub.js 连续排版（scrolled-doc / continuous），下载带实时进度
 *   PDF ：pdf.js 全页堆叠渲染（高清/可缩放），兼容 iOS
 * 依赖 reader.php 注入的 window.BOOKS
 */
(function () {
  'use strict';

  var BOOKS = window.BOOKS || [];

  var state = {
    current: null,   // 当前书对象
    mode: null,      // txt | epub | pdf
    fontSize: 18,
    zoom: 1,         // pdf 缩放倍率（1 = 适应宽度）
    txtNextPos: 0,   // txt 下一个待加载块的字节偏移
    txtTotal: 0,
    txtLoading: false,
    txtHasNext: false,
    rendition: null, // epub 渲染器
    ebook: null,     // epub 书对象
    pdfDoc: null,    // pdf.js 文档
    requestId: 0,    // 异步加载代次，切书/返回时废弃旧请求
    pdfRenderId: 0,  // PDF 重绘代次，避免缩放时旧页面混入
  };

  var els = {};
  function $(id) { return document.getElementById(id); }
  var scrollTimer = null;

  function init() {
    els.bookshelf  = $('bookshelf');
    els.reader     = $('reader');
    els.readerBody = $('readerBody');
    els.readerTitle= $('readerTitle');
    els.backBtn    = $('readerBack');
    els.fontMinus  = $('fontMinus');
    els.fontPlus   = $('fontPlus');
    els.loadInfo   = $('readerLoadInfo');
    els.bottomNav  = $('bottomNav');

    if (!els.reader) return; // 页面结构缺失则什么都不做

    try {
      var fs = parseInt(localStorage.getItem('reader_fontsize') || '18', 10);
      if (fs >= 12 && fs <= 32) state.fontSize = fs;
    } catch (e) {}
    try {
      var z = parseFloat(localStorage.getItem('reader_zoom') || '1');
      if (z >= 0.5 && z <= 3) state.zoom = z;
    } catch (e) {}

    if (els.bookshelf) els.bookshelf.addEventListener('click', onShelfClick);
    if (els.bookshelf) els.bookshelf.addEventListener('keydown', onShelfKeydown);
    els.backBtn.addEventListener('click', closeReader);
    els.fontMinus.addEventListener('click', function () { adjustSize(-1); });
    els.fontPlus.addEventListener('click', function () { adjustSize(1); });
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.addEventListener('pagehide', savePositionNow);
  }

  // ===== 书库 =====
  function onShelfClick(e) {
    var card = e.target.closest('.book-card');
    if (!card) return;
    openReader(card.getAttribute('data-id'));
  }

  function onShelfKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var card = e.target.closest('.book-card');
    if (!card) return;
    e.preventDefault();
    openReader(card.getAttribute('data-id'));
  }

  function findBook(id) {
    for (var i = 0; i < BOOKS.length; i++) if (BOOKS[i].id === id) return BOOKS[i];
    return null;
  }

  function openReader(id) {
    var book = findBook(id);
    if (!book) return;
    state.current = book;
    state.requestId++;
    state.mode = book.format;
    els.readerTitle.textContent = book.title + (book.author ? ' · ' + book.author : '');
    els.readerBody.innerHTML = '';
    if (els.loadInfo) els.loadInfo.textContent = '';
    if (els.bookshelf) els.bookshelf.classList.add('hidden');
    els.reader.classList.remove('hidden');
    if (els.bottomNav) els.bottomNav.classList.add('hidden');
    window.scrollTo(0, 0);

    if (book.format === 'txt') openTxt(book);
    else if (book.format === 'epub') openEpub(book);
    else if (book.format === 'pdf') openPdf(book);
  }

  function closeReader() {
    state.requestId++;
    state.pdfRenderId++;
    savePositionNow();
    if (state.rendition) { try { state.rendition.destroy(); } catch (e) {} state.rendition = null; }
    if (state.ebook) { try { state.ebook.destroy(); } catch (e) {} state.ebook = null; }
    if (state.pdfDoc) { try { state.pdfDoc.destroy(); } catch (e) {} state.pdfDoc = null; }
    state.current = null; state.mode = null;
    state.txtNextPos = 0; state.txtTotal = 0; state.txtHasNext = false; state.txtLoading = false;
    els.readerBody.innerHTML = '';
    els.reader.classList.add('hidden');
    if (els.bookshelf) els.bookshelf.classList.remove('hidden');
    if (els.bottomNav) els.bottomNav.classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  // ===== TXT 连续滚动 =====
  function openTxt(book) {
    els.readerBody.innerHTML = '<div class="reader-text" id="readerText"></div>';
    var saved = loadPos(book.id);
    loadTxtChunk(saved.pos || 0, true);
  }

  function loadTxtChunk(pos, isFirst) {
    if (state.txtLoading) return;
    state.txtLoading = true;
    var requestId = state.requestId;
    fetch('php/reader_api.php?book=' + encodeURIComponent(state.current.id) + '&pos=' + Math.max(0, Math.floor(pos)))
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        if (requestId !== state.requestId) return;
        state.txtLoading = false;
        if (!d.ok) { els.readerBody.innerHTML = '<p class="reader-error">' + esc(d.message || '加载失败') + '</p>'; return; }
        state.txtNextPos = d.nextPos;
        state.txtTotal = d.total;
        state.txtHasNext = d.hasNext;
        var t = $('readerText');
        if (!t) return;
        if (isFirst) t.innerHTML = '';
        var chunk = document.createElement('div');
        chunk.className = 'reader-chunk';
        chunk.setAttribute('data-pos', String(d.pos));
        chunk.textContent = d.text;
        t.appendChild(chunk);
        t.style.fontSize = state.fontSize + 'px';
        if (els.loadInfo && d.total > 0) {
          els.loadInfo.textContent = d.hasNext
            ? '已加载 ' + Math.min(100, Math.round(d.nextPos / d.total * 100)) + '%'
            : '已加载 100%';
        }
      })
      .catch(function (err) {
        if (requestId !== state.requestId) return;
        state.txtLoading = false;
        els.readerBody.innerHTML = '<p class="reader-error">' + esc(err && err.message ? err.message : '文本加载失败') + '</p>';
      });
  }

  function onWindowScroll() {
    if (state.mode === 'txt') {
      scheduleSave();
      var doc = document.documentElement;
      if (state.txtHasNext && !state.txtLoading && doc.scrollHeight - (window.scrollY + window.innerHeight) < 1200) {
        loadTxtChunk(state.txtNextPos, false);
      }
    }
  }
  function scheduleSave() {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(savePositionNow, 400);
  }

  // ===== EPUB 连续排版 =====
  var epubLoaded = false, epubLibPromise = null;
  function loadEpubLib() {
    if (epubLoaded) return Promise.resolve();
    if (epubLibPromise) return epubLibPromise;
    epubLibPromise = new Promise(function (resolve, reject) {
      var srcs = [
        'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
        'https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js',
      ];
      var i = 0;
      function next() {
        if (i >= srcs.length) { epubLoaded = true; epubLibPromise = null; resolve(); return; }
        var s = document.createElement('script');
        s.src = srcs[i++];
        s.onload = next;
        s.onerror = function () { epubLibPromise = null; reject(new Error('epub 组件加载失败（可能是网络访问不了 jsdelivr）')); };
        document.head.appendChild(s);
      }
      next();
    });
    return epubLibPromise;
  }

  function openEpub(book) {
    els.readerBody.innerHTML = '<div class="epub-viewer" id="epubViewer"><p class="reader-error" id="epubLoading">正在下载 EPUB… 0%</p></div>';
    var saved = loadPos(book.id);
    var requestId = state.requestId;
    fetchWithProgress('books/' + encodeURIComponent(book.file), function (pct) {
      var el = $('epubLoading');
      if (el) el.textContent = '正在下载 EPUB… ' + pct + '%';
    }).then(function (buf) {
      if (requestId !== state.requestId) return Promise.reject(new Error('cancelled'));
      var el = $('epubLoading');
      if (el) el.textContent = '正在解析 EPUB…';
      return loadEpubLib().then(function () {
        if (requestId !== state.requestId) throw new Error('cancelled');
        if (!window.ePub) throw new Error('epub 组件不可用');
        var ebook = ePub(buf);
        state.ebook = ebook;
        var rendition = ebook.renderTo('epubViewer', {
          width: '100%', height: '100%',
          flow: 'scrolled-doc', manager: 'continuous', spread: 'none',
        });
        state.rendition = rendition;
        return rendition.display(saved.cfi || undefined).then(function () {
          rendition.themes.fontSize(state.fontSize + 'px');
          var el2 = $('epubLoading'); if (el2) el2.remove();
          if (els.loadInfo && ebook.spine) els.loadInfo.textContent = '共 ' + ebook.spine.length + ' 节 · 连续滚动';
        });
      });
    }).catch(function (err) {
      if (err && err.message === 'cancelled') return;
      if (!state.current || state.current.id !== book.id) return;
      els.readerBody.innerHTML = '<p class="reader-error">' + esc(err && err.message ? err.message : 'EPUB 打开失败') + '</p>';
    });
  }

  function fetchWithProgress(url, onProgress) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var total = parseInt(res.headers.get('Content-Length') || '0', 10) || 0;
      if (!res.body || !res.body.getReader || !total) return res.arrayBuffer();
      var reader = res.body.getReader();
      var received = 0;
      var parts = [];
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return new Blob(parts).arrayBuffer();
          parts.push(r.value);
          received += r.value.length;
          if (onProgress) onProgress(Math.max(1, Math.min(99, Math.round(received / total * 100))));
          return pump();
        });
      }
      return pump();
    });
  }

  // ===== PDF 全页堆叠渲染（高清 + 缩放） =====
  var pdfLoaded = false, pdfLibPromise = null;
  function loadPdfLib() {
    if (pdfLoaded) return Promise.resolve();
    if (pdfLibPromise) return pdfLibPromise;
    pdfLibPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
      s.onload = function () {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          pdfLoaded = true; pdfLibPromise = null; resolve();
        } else {
          pdfLibPromise = null; reject(new Error('pdf 组件不可用'));
        }
      };
      s.onerror = function () { pdfLibPromise = null; reject(new Error('pdf 组件加载失败（可能是网络访问不了 jsdelivr）')); };
      document.head.appendChild(s);
    });
    return pdfLibPromise;
  }

  function openPdf(book) {
    els.readerBody.innerHTML = '<div class="pdf-viewer" id="pdfViewer"><p class="reader-error">正在加载 PDF…</p></div>';
    var requestId = state.requestId;
    loadPdfLib().then(function () {
      if (requestId !== state.requestId) throw new Error('cancelled');
      var task = window.pdfjsLib.getDocument('books/' + encodeURIComponent(book.file));
      task.promise.then(function (pdf) {
        if (requestId !== state.requestId) { try { pdf.destroy(); } catch (e) {} return; }
        state.pdfDoc = pdf;
        if (els.loadInfo) els.loadInfo.textContent = '共 ' + pdf.numPages + ' 页 · 缩放 ' + Math.round(state.zoom * 100) + '%';
        renderPdfAll();
      }).catch(function (err) { if (!err || err.message !== 'cancelled') pdfError(book); });
    }).catch(function (err) {
      if (err && err.message === 'cancelled') return;
      pdfError(book, err && err.message);
    });
  }

  function pdfError(book, msg) {
    if (!state.current || state.current.id !== book.id) return;
    var url = 'books/' + encodeURIComponent(book.file);
    els.readerBody.innerHTML = '<div class="reader-error"><p style="margin-bottom:1rem;">' + esc(msg || 'PDF 打开失败') + '</p><a class="btn btn-primary" href="' + url + '" download>直接下载 PDF</a></div>';
  }

  function renderPdfAll() {
    var pdf = state.pdfDoc;
    if (!pdf) return;
    var v = $('pdfViewer');
    if (!v) return;
    v.innerHTML = '';
    var renderId = ++state.pdfRenderId;
    var dpr = window.devicePixelRatio || 1;
    for (var n = 1; n <= pdf.numPages; n++) {
      (function (n, canvas) {
        canvas.className = 'pdf-page-canvas';
        canvas.setAttribute('aria-label', 'PDF 第 ' + n + ' 页');
        v.appendChild(canvas);
        pdf.getPage(n).then(function (page) {
          if (renderId !== state.pdfRenderId || pdf !== state.pdfDoc) return;
          var vp1 = page.getViewport({ scale: 1 });
          var base = Math.max(320, v.clientWidth - 40) / vp1.width; // 适应容器宽度
          var scale = base * state.zoom;
          var dispW = vp1.width * scale;
          var dispH = vp1.height * scale;
          var vp = page.getViewport({ scale: scale * dpr });
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = dispW + 'px';
          canvas.style.height = dispH + 'px';
          page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise.catch(function () {});
        });
      })(n, document.createElement('canvas'));
    }
  }

  // ===== 字号 / PDF 缩放 =====
  function adjustSize(delta) {
    if (state.mode === 'pdf') {
      state.zoom = Math.min(3, Math.max(0.5, Math.round((state.zoom + delta * 0.25) * 100) / 100));
      try { localStorage.setItem('reader_zoom', String(state.zoom)); } catch (e) {}
      if (els.loadInfo) els.loadInfo.textContent = '共 ' + (state.pdfDoc ? state.pdfDoc.numPages : '') + ' 页 · 缩放 ' + Math.round(state.zoom * 100) + '%';
      renderPdfAll();
    } else {
      state.fontSize = Math.min(32, Math.max(12, state.fontSize + delta));
      try { localStorage.setItem('reader_fontsize', String(state.fontSize)); } catch (e) {}
      var t = $('readerText');
      if (t) t.style.fontSize = state.fontSize + 'px';
      if (state.rendition) { try { state.rendition.themes.fontSize(state.fontSize + 'px'); } catch (e) {} }
    }
  }

  // ===== 进度记忆（TXT 记字节偏移，EPUB 记 cfi） =====
  function savePositionNow() {
    if (!state.current || !state.current.id) return;
    if (state.mode === 'txt') {
      var chunks = els.readerBody ? els.readerBody.querySelectorAll('.reader-chunk') : [];
      var st = window.scrollY || document.documentElement.scrollTop || 0;
      var best = null;
      for (var i = 0; i < chunks.length; i++) {
        var top = chunks[i].offsetTop;
        if (top <= st + 100) best = chunks[i].getAttribute('data-pos');
        else break;
      }
      if (best !== null) savePos(state.current.id, parseInt(best, 10) || 0);
    } else if (state.mode === 'epub') {
      try {
        var loc = state.rendition && state.rendition.currentLocation();
        if (loc && loc.start && loc.start.cfi) {
          var s = loadPos(state.current.id);
          s.cfi = loc.start.cfi;
          savePos(state.current.id, s.pos || 0, s.cfi);
        }
      } catch (e) {}
    }
  }

  function loadPos(id) {
    try { return JSON.parse(localStorage.getItem('reader_pos_' + id) || 'null') || {}; } catch (e) { return {}; }
  }
  function savePos(id, pos, cfi) {
    try {
      var d = { pos: pos || 0, t: Date.now() };
      if (cfi) d.cfi = cfi;
      localStorage.setItem('reader_pos_' + id, JSON.stringify(d));
    } catch (e) {}
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  document.addEventListener('DOMContentLoaded', init);
})();
