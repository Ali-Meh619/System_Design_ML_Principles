/* System Design & ML Playbook — Interactive Navigator */
(function () {
  'use strict';

  const topics = Array.isArray(window.TOPICS) ? window.TOPICS : [];

  /* ══════════════════════════════════
     LocalStorage helpers
     ══════════════════════════════════ */
  const LS = {
    READ:      'sdp_read',
    BOOKMARKS: 'sdp_bookmarks',
    THEME:     'sdp_theme',
    VIEW:      'sdp_view',
  };

  function store(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }
  function load(key, def) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : def;
    } catch (_) { return def; }
  }

  let read      = load(LS.READ,      []);
  let bookmarks = load(LS.BOOKMARKS, []);

  /* ══════════════════════════════════
     Learning paths
     ══════════════════════════════════ */
  const PATHS = {
    beginner: [
      'The System Design Interview Framework',
      'Numbers Every Engineer Must Know',
      'Database Selection Guide',
      'Caching Deep Dive',
      'API Design & API Gateway',
      'Rate Limiting In Depth',
    ],
    mid: [
      'Distributed System Fundamentals',
      'Resilience Patterns',
      'Observability & Monitoring',
      'High Availability & Auto Scaling',
      'Microservices vs Monolith',
      'Notification System Design',
      'Message Queues & Event Streaming',
    ],
    advanced: [
      'AI Agent System Design',
      'Real-time Collaboration (Google Docs)',
      'Probabilistic Data Structures',
      'Stream Processing & Top-K Systems',
      'Distributed Locking',
      'Machine Learning in System Design',
      'Database Internals',
    ],
  };

  /* ══════════════════════════════════
     Category → CSS class
     ══════════════════════════════════ */
  function catClass(category) {
    /* Remove spaces, &, punctuation — keep letters only, all lower */
    return 'cat-' + (category || '').toLowerCase().replace(/[^a-z]/g, '');
  }

  /* ══════════════════════════════════
     State
     ══════════════════════════════════ */
  const state = {
    query:    '',
    category: 'All',
    view:     load(LS.VIEW, 'grid'),
    path:     null,
  };

  const categories = ['All'].concat(
    Array.from(new Set(topics.map(t => t.category))).sort((a, b) => a.localeCompare(b))
  );

  /* ══════════════════════════════════
     DOM refs
     ══════════════════════════════════ */
  function $(id) { return document.getElementById(id); }

  const el = {
    searchInput:       $('searchInput'),
    tagFilters:        $('tagFilters'),
    topicGrid:         $('topicGrid'),
    emptyState:        $('emptyState'),
    topicCount:        $('topicCount'),
    categoryCount:     $('categoryCount'),
    readCount:         $('readCount'),
    bookmarkCount:     $('bookmarkCount'),
    progressPct:       $('progressPct'),
    progressFill:      $('progressFill'),
    progressTrack:     $('progressTrack'),
    viewGrid:          $('viewGrid'),
    viewList:          $('viewList'),
    themeToggle:       $('themeToggle'),
    bookmarkToggle:    $('bookmarkToggle'),
    navBookmarkBadge:  $('navBookmarkBadge'),
    quizToggle:        $('quizToggle'),
    shortcutsBtn:      $('shortcutsBtn'),
    bookmarkSidebar:   $('bookmarkSidebar'),
    closeSidebar:      $('closeSidebar'),
    sidebarBackdrop:   $('sidebarBackdrop'),
    bookmarkList:      $('bookmarkList'),
    emptyBookmarks:    $('emptyBookmarks'),
    quizOverlay:       $('quizOverlay'),
    quizCategory:      $('quizCategory'),
    quizQuestion:      $('quizQuestion'),
    quizAnswer:        $('quizAnswer'),
    quizAnswerBlock:   $('quizAnswerBlock'),
    quizHint:          $('quizHint'),
    quizProgress:      $('quizProgress'),
    quizDots:          $('quizDots'),
    quizReveal:        $('quizReveal'),
    quizNext:          $('quizNext'),
    quizPrev:          $('quizPrev'),
    closeQuiz:         $('closeQuiz'),
    quizOpenLink:      $('quizOpenLink'),
    shortcutsModal:    $('shortcutsModal'),
    closeShortcuts:    $('closeShortcuts'),
    toast:             $('toast'),
    clearPath:         $('clearPath'),
    topicsHeading:     $('topicsHeading'),
    progressStatCard:  $('progressStatCard'),
    bookmarkStatCard:  $('bookmarkStatCard'),
    clearFilters:      $('clearFilters'),
  };

  /* ══════════════════════════════════
     Theme
     ══════════════════════════════════ */
  function initTheme() {
    const saved = load(LS.THEME, null);
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = saved || preferred;
    document.documentElement.setAttribute('data-theme', theme);
  }

  function syncHighlightTheme(theme) {
    document.querySelectorAll('link[href*="highlightjs"]').forEach(link => {
      if (link.href.includes('github-dark')) {
        link.media = theme === 'dark' ? 'all' : 'not all';
      } else if (link.href.includes('github.min')) {
        link.media = theme === 'dark' ? 'not all' : 'all';
      }
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store(LS.THEME, next);
    syncHighlightTheme(next);
    showToast(next === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on');
  }

  /* ══════════════════════════════════
     View mode
     ══════════════════════════════════ */
  function setView(v) {
    state.view = v;
    store(LS.VIEW, v);
    el.topicGrid.classList.toggle('list-view', v === 'list');
    el.viewGrid.classList.toggle('active',  v === 'grid');
    el.viewList.classList.toggle('active',  v === 'list');
    el.viewGrid.setAttribute('aria-pressed', String(v === 'grid'));
    el.viewList.setAttribute('aria-pressed', String(v === 'list'));
    renderCards();
  }

  /* ══════════════════════════════════
     Toast
     ══════════════════════════════════ */
  let toastTimer = null;
  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.toast.classList.add('show'));
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove('show');
      setTimeout(() => { el.toast.hidden = true; }, 400);
    }, 2200);
  }

  /* ══════════════════════════════════
     Animated counter
     ══════════════════════════════════ */
  function animateCount(domEl, target, duration) {
    if (!domEl) return;
    duration = duration || 600;
    const start = Date.now();
    const from  = parseInt(domEl.textContent, 10) || 0;
    (function tick() {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      domEl.textContent = String(Math.round(from + (target - from) * ease));
      if (progress < 1) requestAnimationFrame(tick);
    })();
  }

  /* ══════════════════════════════════
     Filter & match
     ══════════════════════════════════ */
  function norm(s) { return (s || '').toLowerCase().trim(); }

  function matches(topic) {
    const q = norm(state.query);

    /* Path filter overrides category + search */
    if (state.path) return PATHS[state.path].includes(topic.title);

    const inCat = state.category === 'All' || topic.category === state.category;
    if (!inCat) return false;
    if (!q)     return true;

    const haystack = norm(
      [topic.title, topic.category, topic.summary, ...(topic.tags || [])].join(' ')
    );
    return haystack.includes(q);
  }

  /* ══════════════════════════════════
     HTML helpers
     ══════════════════════════════════ */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function highlight(text, query) {
    if (!query) return esc(text);
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return esc(text).replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
  }

  /* ══════════════════════════════════
     Render: filter pills
     ══════════════════════════════════ */
  function renderFilters() {
    el.tagFilters.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = `filter-btn${state.category === cat ? ' active' : ''}`;
      const count = cat === 'All' ? topics.length : topics.filter(t => t.category === cat).length;
      btn.textContent = cat === 'All' ? `All (${count})` : `${cat} (${count})`;
      btn.addEventListener('click', () => {
        state.category = cat;
        if (state.path) { state.path = null; syncPathButtons(); }
        render();
      });
      el.tagFilters.appendChild(btn);
    });
  }

  /* ══════════════════════════════════
     Render: stats & progress
     ══════════════════════════════════ */
  function renderStats() {
    const done = topics.filter(t => read.includes(t.title)).length;
    const pct  = topics.length ? Math.round((done / topics.length) * 100) : 0;

    animateCount(el.readCount,     done);
    animateCount(el.bookmarkCount, bookmarks.length);

    el.progressFill.style.width = pct + '%';
    el.progressPct.textContent  = pct + '%';
    el.progressTrack.setAttribute('aria-valuenow', pct);

    if (bookmarks.length > 0) {
      el.navBookmarkBadge.hidden      = false;
      el.navBookmarkBadge.textContent = bookmarks.length;
    } else {
      el.navBookmarkBadge.hidden = true;
    }
  }

  /* ══════════════════════════════════
     Render: topic cards
     ══════════════════════════════════ */
  function renderCards() {
    const filtered = topics.filter(matches);
    const q        = norm(state.query);

    el.topicGrid.innerHTML = '';

    filtered.forEach((topic, i) => {
      const isRead       = read.includes(topic.title);
      const isBookmarked = bookmarks.includes(topic.title);
      const cc           = catClass(topic.category);

      const card = document.createElement('article');
      card.className = [
        'topic-card',
        cc,
        isRead       ? 'is-read'       : '',
        isBookmarked ? 'is-bookmarked' : '',
      ].filter(Boolean).join(' ');
      card.setAttribute('role', 'listitem');
      card.style.animationDelay = Math.min(i * 25, 350) + 'ms';

      /* Build subtopics HTML */
      const subtopicsHtml = (topic.subtopics && topic.subtopics.length > 0)
        ? `<ul class="card-subtopics" aria-label="Subtopics">
             ${topic.subtopics.map(s =>
               `<li class="card-subtopic">${highlight(s, q)}</li>`
             ).join('')}
           </ul>`
        : '';

      card.innerHTML = `
        <div class="card-top">
          <span class="card-category">${esc(topic.category)}</span>
          <div class="card-actions">
            <button
              class="card-action-btn${isBookmarked ? ' is-active' : ''}"
              data-action="bookmark"
              title="${isBookmarked ? 'Remove bookmark' : 'Bookmark this topic'}"
              aria-label="${isBookmarked ? 'Remove bookmark' : 'Bookmark'}: ${esc(topic.title)}"
              aria-pressed="${isBookmarked}"
            >🔖</button>
            <button
              class="card-action-btn${isRead ? ' is-active' : ''}"
              data-action="read"
              title="${isRead ? 'Mark as unread' : 'Mark as read'}"
              aria-label="${isRead ? 'Mark as unread' : 'Mark as read'}: ${esc(topic.title)}"
              aria-pressed="${isRead}"
            >${isRead ? '✅' : '○'}</button>
          </div>
        </div>
        <div class="card-content">
          <div class="card-title-row">
            <span class="card-icon" aria-hidden="true">${esc(topic.icon || '📄')}</span>
            <h3 class="card-title">${highlight(topic.title, q)}</h3>
          </div>
          <p class="card-summary">${highlight(topic.summary, q)}</p>
          ${subtopicsHtml}
        </div>
        <div class="card-footer">
          <button class="card-link" data-action="open">
            Read topic →
          </button>
          ${topic.difficulty
            ? `<span class="card-difficulty diff-${esc(topic.difficulty)}">${esc(
                topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)
              )}</span>`
            : ''}
        </div>
      `;

      /* Action handlers */
      card.querySelector('[data-action="bookmark"]').addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(topic.title);
      });
      card.querySelector('[data-action="read"]').addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        toggleRead(topic.title);
      });
      card.querySelector('[data-action="open"]').addEventListener('click', e => {
        e.preventDefault();
        openReader(topic);
      });
      /* Also open reader on card body click (but not action buttons) */
      card.addEventListener('click', e => {
        if (e.target.closest('[data-action]')) return;
        openReader(topic);
      });

      el.topicGrid.appendChild(card);
    });

    el.emptyState.hidden = filtered.length > 0;

    /* Update section heading */
    if (state.path) {
      const names = { beginner: 'Beginner Path', mid: 'Mid-Level Path', advanced: 'Advanced Path' };
      el.topicsHeading.textContent = names[state.path] || 'Topics';
    } else if (state.category !== 'All') {
      el.topicsHeading.textContent = state.category;
    } else {
      el.topicsHeading.textContent = 'All Topics';
    }
  }

  /* ══════════════════════════════════
     Toggle read / bookmark
     ══════════════════════════════════ */
  function toggleRead(title) {
    const idx = read.indexOf(title);
    if (idx >= 0) {
      read.splice(idx, 1);
      showToast('Marked as unread');
    } else {
      read.push(title);
      showToast('✅ Marked as read!');
    }
    store(LS.READ, read);
    render();
  }

  function toggleBookmark(title) {
    const idx = bookmarks.indexOf(title);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
      showToast('Bookmark removed');
    } else {
      bookmarks.push(title);
      showToast('🔖 Bookmarked!');
    }
    store(LS.BOOKMARKS, bookmarks);
    render();
    if (!el.bookmarkSidebar.classList.contains('open')) return;
    renderBookmarkSidebar();
  }

  /* ══════════════════════════════════
     Bookmark sidebar
     ══════════════════════════════════ */
  function renderBookmarkSidebar() {
    el.bookmarkList.innerHTML = '';
    const saved = topics.filter(t => bookmarks.includes(t.title));
    el.emptyBookmarks.style.display = saved.length ? 'none' : '';

    saved.forEach(topic => {
      const cc   = catClass(topic.category);
      const item = document.createElement('button');
      item.type      = 'button';
      item.className = `bookmark-item ${cc}`;
      item.innerHTML = `
        <div class="bookmark-dot"></div>
        <div>
          <div class="bookmark-cat">${esc(topic.category)}</div>
          <div class="bookmark-title">${esc(topic.title)}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        closeSidebar();
        setTimeout(() => openReader(topic), 350);
      });
      el.bookmarkList.appendChild(item);
    });
  }

  function openSidebar() {
    el.bookmarkSidebar.hidden = false;
    el.sidebarBackdrop.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.bookmarkSidebar.classList.add('open');
        el.sidebarBackdrop.classList.add('visible');
      });
    });
    renderBookmarkSidebar();
    setTimeout(() => el.closeSidebar && el.closeSidebar.focus(), 100);
  }

  function closeSidebar() {
    el.bookmarkSidebar.classList.remove('open');
    el.sidebarBackdrop.classList.remove('visible');
    setTimeout(() => {
      el.bookmarkSidebar.hidden = true;
      el.sidebarBackdrop.hidden = true;
    }, 350);
  }

  /* ══════════════════════════════════
     Quiz
     ══════════════════════════════════ */
  let quizTopics   = [];
  let quizIndex    = 0;
  let quizRevealed = false;

  function startQuiz() {
    quizTopics   = [...topics].sort(() => Math.random() - 0.5);
    quizIndex    = 0;
    quizRevealed = false;
    el.quizOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    renderQuizCard();
  }

  function closeQuiz() {
    el.quizOverlay.hidden = true;
    document.body.style.overflow = '';
  }

  function renderQuizCard() {
    const topic = quizTopics[quizIndex];
    if (!topic) return;

    const cc = catClass(topic.category);
    el.quizCategory.className   = `quiz-cat-badge ${cc}`;
    el.quizCategory.textContent = topic.category;
    el.quizQuestion.textContent = topic.title;
    el.quizAnswer.textContent   = topic.summary;
    el.quizOpenLink.href        = '#';
    el.quizOpenLink.onclick     = e => {
      e.preventDefault();
      closeQuiz();
      setTimeout(() => openReader(topic), 200);
    };

    el.quizAnswerBlock.hidden = !quizRevealed;
    el.quizHint.hidden        = quizRevealed;
    el.quizReveal.hidden      = quizRevealed;
    el.quizNext.hidden        = !quizRevealed;
    el.quizProgress.textContent = `${quizIndex + 1} / ${quizTopics.length}`;

    /* Dots (cap at 24) */
    el.quizDots.innerHTML = '';
    const maxDots = Math.min(quizTopics.length, 24);
    for (let i = 0; i < maxDots; i++) {
      const dot = document.createElement('div');
      dot.className = 'quiz-dot' +
        (i === quizIndex ? ' active' : i < quizIndex ? ' done' : '');
      el.quizDots.appendChild(dot);
    }
  }

  function revealQuiz() {
    quizRevealed = true;
    renderQuizCard();
  }

  function nextQuiz() {
    quizIndex    = (quizIndex + 1) % quizTopics.length;
    quizRevealed = false;
    renderQuizCard();
  }

  function prevQuiz() {
    quizIndex    = (quizIndex - 1 + quizTopics.length) % quizTopics.length;
    quizRevealed = false;
    renderQuizCard();
  }

  /* ══════════════════════════════════
     Inline Markdown Reader
     ══════════════════════════════════ */
  const elR = {
    overlay:    $('readerOverlay'),
    panel:      $('readerPanel'),
    body:       $('readerPanel') && $('readerPanel').querySelector('.reader-body'),
    icon:       $('readerTopicIcon'),
    category:   $('readerCategory'),
    title:      $('readerTitle'),
    content:    $('readerContent'),
    loading:    $('readerLoading'),
    bookmark:   $('readerBookmark'),
    read:       $('readerRead'),
    github:     $('readerGithub'),
    markRead:   $('readerMarkRead'),
    prev:       $('readerPrev'),
    next:       $('readerNext'),
    close:      $('closeReader'),
  };

  let readerTopic    = null;
  let readerFiltered = [];

  const mdCache = {};

  function openReader(topic) {
    readerTopic    = topic;
    readerFiltered = topics.filter(matches);

    /* Header */
    elR.icon.textContent     = topic.icon || '📄';
    elR.category.textContent = topic.category;
    elR.title.textContent    = topic.title;

    /* GitHub raw link */
    const rawPath = topic.path.replace(/^\.\.\//, '');
    elR.github.href = `https://github.com/Ali-Meh619/System_Design_ML_Principles/blob/main/${rawPath}`;

    /* Update action buttons */
    syncReaderButtons(topic.title);

    /* Show overlay */
    elR.overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    elR.close.focus();

    /* Load markdown */
    loadMarkdown(topic);
  }

  function syncReaderButtons(title) {
    const isBookmarked = bookmarks.includes(title);
    const isRead       = read.includes(title);
    elR.bookmark.innerHTML    = isBookmarked
      ? '<span title="Remove bookmark" aria-label="Remove bookmark">🔖</span>'
      : '<span title="Bookmark" aria-label="Bookmark">🔖</span>';
    elR.bookmark.classList.toggle('is-active', isBookmarked);
    elR.read.innerHTML        = isRead
      ? '<span aria-label="Mark as unread">✅</span>'
      : '<span aria-label="Mark as read">○</span>';
    elR.read.classList.toggle('is-active', isRead);
    elR.markRead.textContent  = isRead ? '✓ Marked as Read' : 'Mark as Read';
    elR.markRead.classList.toggle('btn-quiz--done', isRead);
  }

  function loadMarkdown(topic) {
    /* Show spinner, clear previous content */
    elR.loading.removeAttribute('hidden');
    elR.content.innerHTML = '';
    if (elR.body) elR.body.scrollTop = 0;

    if (mdCache[topic.path]) {
      renderMarkdown(mdCache[topic.path]);
      return;
    }

    fetch(topic.path)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(md => {
        mdCache[topic.path] = md;
        renderMarkdown(md);
      })
      .catch(err => {
        elR.loading.setAttribute('hidden', '');
        const ghPath = topic.path.replace(/^\.\.\//, '');
        elR.content.innerHTML =
          '<div style="padding:2.5rem 2rem;text-align:center;color:var(--text-muted)">' +
          '<p style="font-size:2rem;margin:0 0 .75rem">&#x1F615;</p>' +
          '<p style="font-weight:600;color:var(--text);margin:0 0 .4rem">Could not load content</p>' +
          '<p style="font-size:.85rem;opacity:.7;margin:0 0 1.25rem">' + esc(err.message) + '</p>' +
          '<a href="https://github.com/Ali-Meh619/System_Design_ML_Principles/blob/main/' + esc(ghPath) + '"' +
          ' target="_blank" rel="noopener noreferrer"' +
          ' style="color:var(--primary);text-decoration:underline">View on GitHub \u2192</a>' +
          '</div>';
      });
  }

  /* Configure marked once on load */
  (function initMarked() {
    if (typeof marked !== 'undefined' && typeof marked.use === 'function') {
      try { marked.use({ gfm: true, breaks: false }); } catch (_) {}
    }
  })();

  function renderMarkdown(md) {
    /* Hide spinner — it's a sibling of readerContent so content is independent */
    elR.loading.setAttribute('hidden', '');

    const wrapper = document.createElement('div');

    if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
      try {
        wrapper.innerHTML = marked.parse(md);
      } catch (_) {
        const pre = document.createElement('pre');
        pre.style.cssText = 'white-space:pre-wrap;padding:1.5rem;line-height:1.6;font-size:.9rem';
        pre.textContent = md;
        wrapper.appendChild(pre);
      }
    } else {
      const pre = document.createElement('pre');
      pre.style.cssText = 'white-space:pre-wrap;padding:1.5rem;line-height:1.6;font-size:.9rem';
      pre.textContent = md;
      wrapper.appendChild(pre);
    }

    /* Fix relative image paths: ../../assets/ → ../assets/ (relative to site/) */
    wrapper.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (src.startsWith('../../assets/')) {
        img.setAttribute('src', src.replace('../../assets/', '../assets/'));
      }
      img.style.maxWidth = '100%';
      img.style.borderRadius = '8px';
      img.style.margin = '1.25rem 0';
      img.style.display = 'block';
      img.setAttribute('loading', 'lazy');
    });

    /* Syntax highlighting for code blocks */
    if (typeof hljs !== 'undefined') {
      wrapper.querySelectorAll('pre code').forEach(block => {
        try { hljs.highlightElement(block); } catch (_) {}
      });
    }

    elR.content.appendChild(wrapper);
  }

  function closeReader() {
    elR.overlay.classList.add('is-closing');
    setTimeout(() => {
      elR.overlay.hidden = true;
      elR.overlay.classList.remove('is-closing');
      document.body.style.overflow = '';
      readerTopic = null;
    }, 250);
  }

  function readerNavigate(dir) {
    if (!readerTopic) return;
    const idx  = readerFiltered.findIndex(t => t.title === readerTopic.title);
    const next = readerFiltered[idx + dir];
    if (next) openReader(next);
  }

  /* Reader event listeners */
  elR.close.addEventListener('click', closeReader);
  elR.overlay.addEventListener('click', e => {
    if (e.target === elR.overlay) closeReader();
  });
  elR.prev.addEventListener('click', () => readerNavigate(-1));
  elR.next.addEventListener('click', () => readerNavigate(1));

  elR.bookmark.addEventListener('click', () => {
    if (!readerTopic) return;
    toggleBookmark(readerTopic.title);
    syncReaderButtons(readerTopic.title);
  });

  elR.read.addEventListener('click', () => {
    if (!readerTopic) return;
    toggleRead(readerTopic.title);
    syncReaderButtons(readerTopic.title);
  });

  elR.markRead.addEventListener('click', () => {
    if (!readerTopic) return;
    toggleRead(readerTopic.title);
    syncReaderButtons(readerTopic.title);
  });

  /* ══════════════════════════════════
     Completed topics sidebar
     ══════════════════════════════════ */
  const elC = {
    sidebar:  $('completedSidebar'),
    close:    $('closeCompleted'),
    list:     $('completedList'),
    empty:    $('emptyCompleted'),
    backdrop: $('completedBackdrop'),
    footerText: $('completedFooterText'),
    footerPct:  $('completedFooterPct'),
  };

  function renderCompletedSidebar() {
    if (!elC.list) return;
    elC.list.innerHTML = '';
    const done = topics.filter(t => read.includes(t.title));
    const pct  = topics.length ? Math.round((done.length / topics.length) * 100) : 0;

    if (elC.empty) elC.empty.style.display = done.length ? 'none' : '';
    if (elC.footerText) elC.footerText.textContent = `${done.length} of ${topics.length} completed`;
    if (elC.footerPct)  elC.footerPct.textContent  = pct + '%';

    done.forEach(topic => {
      const cc   = catClass(topic.category);
      const item = document.createElement('div');
      item.className = `completed-item ${cc}`;
      item.innerHTML =
        '<div class="completed-check">✓</div>' +
        '<div class="completed-item-info">' +
          '<div class="completed-item-cat">' + esc(topic.category) + '</div>' +
          '<div class="completed-item-title">' + esc(topic.title) + '</div>' +
        '</div>' +
        '<button class="completed-item-remove" title="Mark as unread" aria-label="Mark as unread: ' + esc(topic.title) + '">✕</button>';

      item.querySelector('.completed-item-info').addEventListener('click', () => {
        closeCompletedSidebar();
        setTimeout(() => openReader(topic), 350);
      });
      item.querySelector('.completed-item-info').style.cursor = 'pointer';

      item.querySelector('.completed-item-remove').addEventListener('click', e => {
        e.stopPropagation();
        toggleRead(topic.title);
        renderCompletedSidebar();
      });

      elC.list.appendChild(item);
    });
  }

  function openCompletedSidebar() {
    if (!elC.sidebar) return;
    elC.sidebar.hidden = false;
    if (elC.backdrop) elC.backdrop.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elC.sidebar.classList.add('open');
        if (elC.backdrop) elC.backdrop.classList.add('visible');
      });
    });
    renderCompletedSidebar();
    setTimeout(() => elC.close && elC.close.focus(), 100);
  }

  function closeCompletedSidebar() {
    if (!elC.sidebar) return;
    elC.sidebar.classList.remove('open');
    if (elC.backdrop) elC.backdrop.classList.remove('visible');
    setTimeout(() => {
      elC.sidebar.hidden = true;
      if (elC.backdrop) elC.backdrop.hidden = true;
    }, 350);
  }

  if (elC.close) elC.close.addEventListener('click', closeCompletedSidebar);
  if (elC.backdrop) elC.backdrop.addEventListener('click', closeCompletedSidebar);

  /* ══════════════════════════════════
     Learning path buttons
     ══════════════════════════════════ */
  function syncPathButtons() {
    document.querySelectorAll('.path-card').forEach(btn => {
      const active = btn.dataset.path === state.path;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    el.clearPath.hidden = !state.path;
  }

  /* ══════════════════════════════════
     Master render
     ══════════════════════════════════ */
  function render() {
    renderFilters();
    renderCards();
    renderStats();
  }

  /* ══════════════════════════════════
     Static init counts (animated)
     ══════════════════════════════════ */
  function initStaticCounts() {
    animateCount(el.topicCount,    topics.length,            900);
    animateCount(el.categoryCount, categories.length - 1,    900);
  }

  /* ══════════════════════════════════
     Particle canvas
     ══════════════════════════════════ */
  function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(Math.floor((W * H) / 14000), 80);
      for (let i = 0; i < count; i++) {
        particles.push({
          x:  Math.random() * W,
          y:  Math.random() * H,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r:  Math.random() * 1.8 + 0.5,
          a:  Math.random() * 0.4 + 0.15,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();
      });

      /* Connections */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${0.11 * (1 - dist / 110)})`;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); createParticles(); }, 200);
    });
  }

  /* ══════════════════════════════════
     Keyboard shortcuts
     ══════════════════════════════════ */
  document.addEventListener('keydown', e => {
    const tag     = document.activeElement.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

    /* Reader mode captures Escape */
    if (elR.overlay && !elR.overlay.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeReader(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); readerNavigate(1); return; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); readerNavigate(-1); return; }
      return;
    }

    /* Quiz mode captures all keys */
    if (!el.quizOverlay.hidden) {
      if (e.key === 'Escape')                              { e.preventDefault(); closeQuiz(); return; }
      if (e.key === ' ')                                   { e.preventDefault(); if (!quizRevealed) revealQuiz(); return; }
      if (e.key === 'ArrowRight' || e.key === 'Enter')     { e.preventDefault(); quizRevealed ? nextQuiz() : revealQuiz(); return; }
      if (e.key === 'ArrowLeft')                           { e.preventDefault(); prevQuiz(); return; }
      return;
    }

    /* Shortcuts modal */
    if (!el.shortcutsModal.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); el.shortcutsModal.hidden = true; }
      return;
    }

    /* Sidebars */
    if (elC.sidebar && elC.sidebar.classList.contains('open')) {
      if (e.key === 'Escape') { e.preventDefault(); closeCompletedSidebar(); return; }
    }
    if (el.bookmarkSidebar.classList.contains('open')) {
      if (e.key === 'Escape') { e.preventDefault(); closeSidebar(); return; }
    }

    if (e.key === '/' && !inInput) { e.preventDefault(); el.searchInput.focus(); return; }

    if (e.key === 'Escape' && inInput) {
      e.preventDefault();
      state.query = '';
      el.searchInput.value = '';
      el.searchInput.blur();
      renderCards();
      return;
    }

    if (inInput) return;

    switch (e.key) {
      case 'd': toggleTheme(); break;
      case 'b': el.bookmarkSidebar.classList.contains('open') ? closeSidebar() : openSidebar(); break;
      case 'q': startQuiz(); break;
      case '?': el.shortcutsModal.hidden = false; break;
    }
  });

  /* ══════════════════════════════════
     Event listeners
     ══════════════════════════════════ */
  el.searchInput.addEventListener('input', e => {
    state.query = e.target.value;
    renderCards();
  });

  el.themeToggle.addEventListener('click', toggleTheme);
  el.viewGrid.addEventListener('click',   () => setView('grid'));
  el.viewList.addEventListener('click',   () => setView('list'));

  el.bookmarkToggle.addEventListener('click', openSidebar);
  el.bookmarkStatCard && el.bookmarkStatCard.addEventListener('click', openSidebar);
  el.bookmarkStatCard && el.bookmarkStatCard.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSidebar(); }
  });
  el.closeSidebar.addEventListener('click',   closeSidebar);
  el.sidebarBackdrop.addEventListener('click', closeSidebar);

  el.quizToggle.addEventListener('click',  startQuiz);
  el.quizReveal.addEventListener('click',  revealQuiz);
  el.quizNext.addEventListener('click',    nextQuiz);
  el.quizPrev.addEventListener('click',    prevQuiz);
  el.closeQuiz.addEventListener('click',   closeQuiz);

  el.shortcutsBtn.addEventListener('click',    () => { el.shortcutsModal.hidden = false; });
  el.closeShortcuts.addEventListener('click',  () => { el.shortcutsModal.hidden = true; });
  el.shortcutsModal.addEventListener('click',  e  => {
    if (e.target === el.shortcutsModal) el.shortcutsModal.hidden = true;
  });

  document.querySelectorAll('.path-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.path;
      state.path     = state.path === p ? null : p;
      state.category = 'All';
      syncPathButtons();
      render();
    });
  });

  el.clearPath && el.clearPath.addEventListener('click', () => {
    state.path = null;
    syncPathButtons();
    render();
  });

  el.clearFilters && el.clearFilters.addEventListener('click', () => {
    state.query    = '';
    state.category = 'All';
    state.path     = null;
    el.searchInput.value = '';
    syncPathButtons();
    render();
  });

  el.progressStatCard && el.progressStatCard.addEventListener('click', openCompletedSidebar);
  el.progressStatCard && el.progressStatCard.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCompletedSidebar(); }
  });

  /* ══════════════════════════════════
     Back to top
     ══════════════════════════════════ */
  const backToTop = $('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ══════════════════════════════════
     Init
     ══════════════════════════════════ */
  initTheme();
  syncHighlightTheme(document.documentElement.getAttribute('data-theme') || 'light');
  initStaticCounts();

  /* setView already calls renderCards, so skip the redundant render() after */
  el.topicGrid.classList.toggle('list-view', state.view === 'list');
  el.viewGrid.classList.toggle('active',  state.view === 'grid');
  el.viewList.classList.toggle('active',  state.view === 'list');
  el.viewGrid.setAttribute('aria-pressed', String(state.view === 'grid'));
  el.viewList.setAttribute('aria-pressed', String(state.view === 'list'));
  store(LS.VIEW, state.view);

  syncPathButtons();
  render();
  initParticles();

  /* Subtle entrance for stat cards */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.stat-card, .path-card').forEach(c => io.observe(c));
  }
})();
