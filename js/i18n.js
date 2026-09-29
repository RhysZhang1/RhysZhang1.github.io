(function () {
  'use strict';

  const STORAGE_KEY = 'archive-language';
  const valid = new Set(['zh', 'en']);
  let language = valid.has(localStorage.getItem(STORAGE_KEY)) ? localStorage.getItem(STORAGE_KEY) : 'zh';
  const originals = new WeakMap();

  const ui = {
    siteName: { zh: '风春桐海君', en: 'Zephyr Harukiumi' },
    siteTitle: { zh: '风春桐海君 — 游戏 · 故事 · 星辰', en: 'Zephyr Harukiumi — Games · Stories · Stars' },
    siteDescription: { zh: '一个开发者写给游戏、故事与星辰的私人档案馆。', en: "A developer's private archive dedicated to games, stories, and the stars." },
    posts: { zh: '文章', en: 'Posts' },
    tags: { zh: '标签', en: 'Tags' },
    words: { zh: '字', en: 'Words' },
    minuteRead: { zh: '{count} 分钟阅读', en: '{count} min read' },
    allPosts: { zh: '全部文章', en: 'All Posts' },
    backToPosts: { zh: '← 返回文章列表', en: '← Back to all posts' },
    featured: { zh: '精选文章', en: 'Featured' },
    related: { zh: '相关文章', en: 'Related Posts' },
    toc: { zh: '📑 目录', en: '📑 Contents' },
    expand: { zh: '▼ 展开', en: '▼ Expand' },
    collapse: { zh: '▲ 折叠', en: '▲ Collapse' },
    noPosts: { zh: '没有找到匹配的文章', en: 'No matching posts found' },
    postNotFound: { zh: '文章未找到', en: 'Post not found' },
    loadFailed: { zh: '加载失败', en: 'Failed to load' },
    loadingSearch: { zh: '正在搜索全部文章…', en: 'Searching all posts…' },
    searchFailed: { zh: '搜索失败，请稍后重试', en: 'Search failed. Please try again later.' },
    noResult: { zh: '没有找到与「{query}」相关的内容', en: 'No results found for “{query}”' },
    all: { zh: '全部', en: 'All' },
    empty: { zh: '暂无', en: 'Nothing here yet' },
    copy: { zh: '复制', en: 'Copy' },
    copied: { zh: '已复制', en: 'Copied' },
    copyFailed: { zh: '复制失败', en: 'Copy failed' },
    bottleThrowing: { zh: '投递中...', en: 'Casting adrift…' },
    bottlePicking: { zh: '打捞中...', en: 'Fishing one out…' },
    bottleThrow: { zh: '扔进海里', en: 'Cast into the sea' },
    bottlePick: { zh: '捞一个', en: 'Fish one out' },
    needName: { zh: '请填写昵称', en: 'Please enter a name' },
    needMessage: { zh: '请填写内容', en: 'Please enter a message' },
    networkError: { zh: '网络错误，请稍后再试', en: 'Network error. Please try again later.' },
    emptySea: { zh: '海里暂时没有瓶子，先扔一个吧', en: 'The sea is empty for now. Cast a bottle first.' },
    noUpdates: { zh: '暂无动态', en: 'No updates yet' },
    noMessages: { zh: '还没有留言，来写下第一条吧', en: 'No messages yet. Be the first to leave one.' },
    randomMessages: { zh: '随机留言', en: 'Random Messages' },
    shuffle: { zh: '换一批', en: 'Shuffle' },
    fieldsTitle: { zh: '标题', en: 'Title' },
    fieldsTags: { zh: '标签', en: 'Tags' },
    fieldsSummary: { zh: '摘要', en: 'Summary' },
    fieldsBody: { zh: '正文', en: 'Body' }
  };

  const exact = {
    '风春桐海君': 'Zephyr Harukiumi',
    '风春桐海君的私人创作档案馆：记录游戏故事、文学创作与沿途所思。': "Zephyr Harukiumi's private creative archive: game stories, literature, and thoughts gathered along the way.",
    '风春桐海君 — 游戏 · 故事 · 星辰': 'Zephyr Harukiumi — Games · Stories · Stars',
    '一个开发者写给游戏、故事与星辰的私人档案馆。': "A developer's private archive dedicated to games, stories, and the stars.",
    '主导航': 'Primary navigation', '主要创作方向': 'Primary creative themes', '打开菜单': 'Open menu', '关闭菜单': 'Close menu', '搜索 (Ctrl+K)': 'Search (Ctrl+K)', '搜索文章': 'Search posts',
    '字': 'Words', '标签': 'Tags', '项': 'Items', '风': 'Wind',
    '首页': 'Home', '文章': 'Posts', '漂流瓶': 'Drift Bottle', '关于': 'About', '书房': 'Library', '资源': 'Resources', '搜索': 'Search',
    // 阿帽专区（界面文案用 Hat Guy；章节正文里的历史称呼在 data/wanderer.json，不走这里）
    // 下面几条是 data/wanderer*.json 缺字段时的兜底，正常由 JSON 的 sectionTitles 覆盖
    '阿帽': 'Hat Guy', '选择篇章': 'Choose a chapter', '拾遗 · 阿帽语录': 'Fragments · Words of Hat Guy',
    '命之座 · 浪客座': 'Constellation · Peregrinus',
    '纪行 · 登场篇目': 'Chronicle · Appearances', '名场面': 'Scenes', '羁绊': 'Bonds',
    '下载中心': 'Download Center', '在线阅读': 'Online Reading',
    '分享资源与工具文件': 'Shared resources and utility files',
    'TXT · EPUB · PDF 连续滚动阅读 · 进度自动记忆': 'Continuous TXT · EPUB · PDF reading · progress saved automatically',
    '游戏叙事': 'Game Narratives', '文学创作': 'Creative Writing', '沿途所思': 'Notes Along the Way',
    '进入故事': 'Enter the Stories', '打开书房': 'Open the Library',
    '长风破浪会有时，直挂云帆济沧海': 'A time will come to ride the wind and cleave the waves, my cloud-white sail crossing the boundless sea.',
    '我们由星辰所造，终将归于星辰': 'We are made of stardust, and to the stars we shall return.',
    '用代码与文字记录时代': 'Recording our age in code and words', '长风破浪会有时': 'One day I shall ride the wind and cleave the waves',
    '旅途本身就是答案': 'The journey itself is the answer', '森林会记住一切': 'The Forest Will Remember Everything',
    '在无限的故事里寻找有限的答案': 'Seeking finite answers in infinite stories',
    '风起时，草木皆有所向': 'When the wind rises, every leaf finds its way',
    '前行不会带来失去，但会带来相遇': 'Moving forward brings no loss, only new encounters',
    '最新文章': 'Latest Posts', '新近写下的游戏故事、文学创作与随感': 'Recent game stories, creative writing, and reflections', '查看全部文章': 'View All Posts',
    '白天写代码，晚上写故事。在虚构世界里寻找真实，也用文字打捞沿途的时间。': 'I write code by day and stories by night, seeking truth in imagined worlds and salvaging moments with words.',
    '最近文章': 'Recent Posts', '标签云': 'Tag Cloud',
    '「世界上只有一种真正的英雄主义，那就是认清生活的真相之后，依然热爱生活。」': '“There is only one true heroism: to see the world as it is and still love it.”', '罗曼·罗兰': 'Romain Rolland',
    '全部文章': 'All Posts', '记录游戏故事、文学创作与随感杂记': 'Game stories, creative writing, and personal reflections',
    '「那些杀不死我的，使我更强大。」': '“What does not kill me makes me stronger.”', '尼采': 'Friedrich Nietzsche',
    '「不知道自己的无知，是双倍的无知。」': '“Ignorance of one’s own ignorance is ignorance twice compounded.”', '柏拉图': 'Plato',
    '动态': 'Updates', '记录博客的更新与成长轨迹': 'Tracing the archive’s updates and growth',
    '「我们不是因为事情困难而不敢做，而是因为不敢做，事情才变得困难。」': '“It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.”', '塞内加': 'Seneca',
    '留言板': 'Guestbook', '有任何想法、问题或建议？欢迎在这里留言交流': 'Thoughts, questions, or suggestions? Leave a message here.',
    '「在隆冬，我终于知道，我身上有一个不可战胜的夏天。」': '“In the midst of winter, I found there was, within me, an invincible summer.”', '加缪': 'Albert Camus',
    '漂流瓶': 'Drift Bottle', '写一段话扔进海里，再捞一个陌生人的上来 ·': 'Cast a message into the sea, then retrieve one from a stranger ·', '个瓶子漂在海里': 'bottles adrift',
    '扔瓶子': 'Cast a Bottle', '捞瓶子': 'Find a Bottle', '昵称': 'Name', '（会显示在瓶子上）': '(shown on the bottle)', '内容': 'Message', '链接': 'Link', '（选填，分享一个网址）': '(optional, share a URL)',
    '扔进海里': 'Cast into the Sea', '点击按钮随机捞一个漂流瓶': 'Click the button to fish out a random bottle', '捞一个': 'Fish One Out',
    '「天空没有留下翅膀的痕迹，但我已飞过。」': '“The sky bears no trace of wings, yet I have flown.”', '泰戈尔': 'Rabindranath Tagore',
    '热爱技术的开发者 / 写作者': 'Developer / Writer with a love of technology', '白天与代码和服务器打交道，夜晚在游戏、文学与星辰之间收集故事。': 'By day I work with code and servers; by night I gather stories among games, literature, and stars.',
    '你从网络的另一端而来，刚好停在我的坐标上。': 'You came from the other side of the internet and happened to stop at my coordinates.',
    '你从网络的另一端而来，': 'You came from the other side of the internet,', '刚好停在我的坐标上。': 'and happened to stop at my coordinates.',
    '欢迎光临。名字太长的话，喊我': 'Welcome. If the name feels too long, just call me', '欢迎光临。': 'Welcome.', '名字太长的话，喊我': 'If the name feels too long, just call me', '风君': 'Zephyr', '就行。': '',
    '我不太擅长用几行履历概括自己。': 'I am not very good at summarizing myself in a few lines of a résumé.',
    '一个仍在维护的项目，一篇认真写完的文章，一段被反复修改过的代码——这些长久留下来的东西，或许更接近真正的我。': 'A project still maintained, an article written with care, a piece of code revised time and again—the things that endure may come closer to who I really am.',
    '于是我把它们收进这座小小的档案馆，等待某一天，被你翻到。': 'So I gathered them into this little archive, waiting for the day you might turn to their page.',
    '把脑海里的火花接到现实': 'Wiring sparks of thought into reality',
    '我的日常，经常从一个闪得很快的念头开始：能不能做得更顺一点？能不能让机器替人省下一段重复劳动？': 'My days often begin with a fleeting thought: could this work more smoothly? Could a machine spare someone another stretch of repetitive work?',
    '于是终端亮起，Python、Linux、服务器和 AI 工具陆续登场。模糊的想法被拆成结构、接口与一次次测试，最后变成一个能够运行、能够交到别人手里的东西。': 'The terminal lights up; Python, Linux, servers, and AI tools take the stage. A hazy idea becomes structures, interfaces, and rounds of tests, until at last it is something that runs and can be placed in another person’s hands.',
    '灵感接通时，我可以对着屏幕一路工作到忘记时间；大脑过载时，也会和一个最普通的报错僵持半天，最后发现只是少写了一个字符。': 'When inspiration connects, I can work at the screen until time disappears. When my brain overloads, I can wrestle with an ordinary error for half a day, only to discover one missing character.',
    '我喜欢的不是把技术堆得多复杂，而是让复杂藏在背后，让使用它的人觉得自然、清楚，甚至察觉不到那些费过的力气。': 'I do not care for piling on complexity. I prefer to hide it behind something natural and clear, so users may never notice the effort beneath it.',
    '当某个陌生人因此少绕了一步路，项目便不再只是硬盘里的一组文件，而真正进入了现实。': 'When that saves a stranger even one needless step, the project ceases to be a folder on a drive and enters the real world.',
    '✍️ 给未来留一份可检索的底稿': '✍️ Leaving a searchable draft for the future',
    '很多问题解决之后，很快就会从记忆里淡去。博客让我把当时的路径保存下来：哪里判断错了，怎样找到出口，又有哪些答案值得下次直接取用。': 'Once solved, many problems quickly fade from memory. The blog preserves the route I took: where my judgment failed, how I found a way out, and which answers are worth reusing next time.',
    '技术笔记之外，这里也收录我对故事的偏爱。游戏中的一段旅程、书页里的一句话、某个夜晚突然出现的想法，都可能成为一篇文章的起点。': 'Beyond technical notes, this place holds my fondness for stories. A journey in a game, a line on a page, or a thought appearing one night may all begin an article.',
    '工具越来越聪明，获得答案越来越快，但选择什么问题、相信什么方向、愿意为何投入时间，依然是属于人的部分。': 'Tools grow smarter and answers arrive faster, but choosing the question, trusting a direction, and deciding what deserves our time remain profoundly human.',
    '所以我继续写。代码负责构造可以运转的世界，文字负责保存那些无法被编译，却不该被遗忘的东西。': 'So I keep writing. Code builds worlds that run; words preserve what cannot be compiled yet must not be forgotten.',
    '🎮 关掉终端以后，我去别处补充电量': '🎮 When the terminal closes, I recharge elsewhere',
    '屏幕熄下去，生活会切换到另一套运行方式。那些看似与开发无关的时刻，常常又悄悄成为下一次创作的素材。': 'When the screen goes dark, life switches to another mode. Moments seemingly unrelated to development often become material for the next creation.',
    '在文字里远行': 'Travel through words', '读小说、长文和论坛里的陌生观点，借别人的眼睛看一会儿世界。': 'Reading novels, essays, and unfamiliar views on forums—borrowing another person’s eyes for a while.',
    '收集日常切片': 'Collect slices of everyday life', '沿着没有目的地的路线散步，把天气、街灯和偶然遇见的画面存下来。': 'Walking without a destination, saving the weather, streetlights, and accidental scenes along the way.',
    '进入另一种人生': 'Enter another life', '在游戏的地图、音乐与人物中停留，观察一个虚构世界如何让人相信。': 'Lingering among a game’s maps, music, and characters to see how an imagined world earns belief.',
    '📮 如果你也收到了这段信号': '📮 If this signal reached you too',
    '也许你是因为一篇文章来到这里，也许只是沿着链接随手点进来。无论如何，谢谢你愿意停留片刻。': 'Perhaps an article brought you here, or perhaps you simply followed a link. Either way, thank you for staying a while.',
    '如果你想讨论一个技术问题、交换最近喜欢的故事，或有一个值得一起尝试的想法，都可以给我发来消息。': 'If you would like to discuss a technical problem, trade favorite stories, or try an idea together, send me a message.',
    '这座档案馆会继续生长。下一次更新之前，愿我们都在做让自己眼睛发亮的事。': 'This archive will keep growing. Until the next update, may we both be doing something that makes our eyes light up.',
    '这座档案馆会继续生长。': 'This archive will keep growing.', '下一次更新之前，': 'Until the next update,', '愿我们都在做让自己眼睛发亮的事。': 'may we both be doing something that makes our eyes light up.',
    '技能': 'Skills', 'AI / 机器学习': 'AI / Machine Learning', '文学创作': 'Creative Writing', '找到我': 'Find Me', '创作方向': 'Creative Focus',
    '游戏剧情': 'Game Stories', '古典诗词': 'Classical Chinese Poetry', '诗歌翻译': 'Poetry Translation', '二次创作': 'Fan Works',
    '「认识你自己。」': '“Know thyself.”', '苏格拉底': 'Socrates', '留言': 'Guestbook', '下载': 'Downloads', '阅读': 'Read',
    '用代码书写诗篇，以文字打捞时间': 'Writing poetry in code, salvaging time with words', '风春桐海君 · 用代码与文字记录时代': 'Zephyr Harukiumi · Recording our age in code and words',
    '</风春桐海君>': '</Zephyr Harukiumi>', '+ 1 = 0 · 我们由星辰所造，终将归于星辰': '+ 1 = 0 · We are made of stardust, and to the stars we shall return.', '+ 1 = 0  ·  我们由星辰所造，终将归于星辰': '+ 1 = 0 · We are made of stardust, and to the stars we shall return.',
    '瓶子': 'Bottle', '选择': 'Select', '打开': 'Open', '关闭': 'Close', '回到顶部': 'Back to top', '命令面板': 'Command palette', '搜索文章、跳转页面…': 'Search posts or jump to a page…',
    '搜索文章标题、摘要、标签或正文…': 'Search titles, summaries, tags, or full text…', '你的名字': 'Your name', '想说点什么？一句问候、一段想法、一个秘密...': 'What would you like to say? A greeting, a thought, a secret…'
  };

  function t(key, vars) {
    const item = ui[key];
    let value = item ? item[language] : key;
    Object.entries(vars || {}).forEach(([name, replacement]) => { value = value.replace('{' + name + '}', replacement); });
    return value;
  }

  function translateExact(value) {
    const trimmed = String(value).trim();
    return language === 'en' && Object.prototype.hasOwnProperty.call(exact, trimmed) ? String(value).replace(trimmed, exact[trimmed]) : value;
  }

  function apply(root) {
    root = root || document;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement && !node.parentElement.closest('script, style, .post-article-body, [data-no-i18n]')
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!originals.has(node)) originals.set(node, node.nodeValue);
      const source = originals.get(node);
      node.nodeValue = language === 'en' ? translateExact(source) : source;
    });
    root.querySelectorAll?.('[placeholder], [aria-label], [alt], [title], meta[content]').forEach(el => {
      ['placeholder', 'aria-label', 'alt', 'title', 'content'].forEach(attr => {
        if (!el.hasAttribute(attr)) return;
        const camelAttr = attr.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
        const key = 'i18nOriginal' + camelAttr[0].toUpperCase() + camelAttr.slice(1);
        if (!el.dataset[key]) el.dataset[key] = el.getAttribute(attr);
        const source = el.dataset[key];
        el.setAttribute(attr, language === 'en' ? translateExact(source) : source);
      });
    });
  }

  function setLanguage(next, persist) {
    if (!valid.has(next)) return;
    language = next;
    if (persist !== false) localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.body?.classList.toggle('lang-en', language === 'en');
    document.title = ui.siteTitle[language];
    apply(document);
    document.querySelectorAll('[data-lang-choice]').forEach(el => el.classList.toggle('active', el.dataset.langChoice === language));
    document.getElementById('languageToggle')?.setAttribute('aria-label', language === 'en' ? '切换到中文' : 'Switch to English');
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
  }

  window.I18N = {
    t,
    apply,
    get language() { return language; },
    isEnglish: () => language === 'en',
    setLanguage,
    text: value => language === 'en' ? (exact[String(value).trim()] || value) : value
  };

  document.addEventListener('DOMContentLoaded', () => setLanguage(language, false), { once: true });
})();
