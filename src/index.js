import marked from 'marked';
import './styles';
import { makeId, scrollIntoView, treeify } from './util';

const $ = document.querySelector.bind(document);

const renderer = {
  paragraph(text) {
    if (text === '[TOC]') {
      return `<p id="toc" class="toc"></p>`;
    }

    return `<p>${text}</p>`;
  },
  heading(text, level) {
    const tag = `h${level}`;
    return `<${tag} id="${makeId(text)}">${text}</${tag}>`;
  },
};

marked.use({ renderer });

let headings = [];
const walkTokens = token => {
  if (token.type === 'heading' && (token.depth === 2 || token.depth === 3)) {
    headings.push({
      level: token.depth,
      text: token.text,
      id: makeId(token.text),
      children: [],
    });
  }
};

marked.use({ walkTokens });

function _renderMarkdown(text) {
  headings = [];
  const rendered = marked(text);
  return {
    headings,
    html: rendered,
  };
}

function fetchText(url) {
  return fetch(url).then(resp => {
    if (resp.ok) {
      return resp.text();
    }

    return Promise.resolve('');
  });
}

async function renderMarkdown(url, defaultResult = 'not found or render markdown failed') {
  const _defaultResult = {
    html: defaultResult,
    headings: [],
  };

  try {
    const text = await fetchText(url);
    if (!text) {
      return _defaultResult;
    }

    return _renderMarkdown(text);
  } catch {
    return _defaultResult;
  }
}

class Marknote {
  constructor(config) {
    this._config = config;
    this.$sidebar = $('#sidebar');
    this.$post = $('#content');
    this.$menuSwitch = $('.sidebar-control');
    this.$siteName = $('.site-name');
    this.$permalink = $('.permalink');
    this.$backToTop = $('.back-to-top');
    this.$backToTopButton = $('.back-to-top .button');

    this._menuIsShowing = false;

    window.addEventListener('popstate', this._renderSidebarAndContent.bind(this));
    this.$menuSwitch.addEventListener('click', this._clickOnMenu.bind(this));
    this.$backToTopButton.addEventListener('click', this._goBackToTop.bind(this));

    this._lifeCycleHooks = {};
  }

  _clickOnMenu() {
    if (this._menuIsShowing) {
      this.$sidebar.classList.remove('showing');
      this.$menuSwitch.classList.remove('showing');
    } else {
      this.$sidebar.classList.add('showing');
      this.$menuSwitch.classList.add('showing');
    }

    this._menuIsShowing = !this._menuIsShowing;
  }

  _goBackToTop() {
    scrollIntoView(this.$post);
  }

  _renderSidebarAndContent() {
    const [url, queryParams] = location.hash.split('?');
    this._renderContent(url);
    this._renderBackToTop();

    let sidebarFileName = 'SIDEBAR.md';
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      const name = params.get('sidebar');
      sidebarFileName = name || sidebarFileName;
    }

    this._renderSidebar(sidebarFileName);
  }

  _renderBackToTop() {
    this.$backToTop.classList.add('visible');
  }

  _renderSidebar(sidebarFileName = 'SIDEBAR.md') {
    return renderMarkdown(sidebarFileName, '').then(({ html }) => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, 'text/html');
      const currentHost = location.host;

      dom.querySelectorAll('a').forEach(it => {
        const url = new URL(it.href);

        // host 与当前页面不一致的，属于外部连接，保持原样
        if (url.host !== currentHost) {
          it.setAttribute('target', '_blank');
          return;
        }

        // 渲染侧栏时，自动加上 sidebar 参数
        if (!url.searchParams.has('sidebar')) {
          url.searchParams.set('sidebar', sidebarFileName);
        }

        const basePath = this._config.basePath || '/';

        const hash = `${basePath}#${url.pathname}?${url.searchParams}`;
        it.setAttribute('href', hash);
      });

      this.$sidebar.innerHTML = dom.body.innerHTML;

      this.$sidebar.querySelectorAll('a').forEach(it => {
        it.addEventListener('click', this._clickOnMenu.bind(this));
      });
    });
  }

  _renderCustomContent() {
    const { siteName } = this._config || {};
    if (siteName) {
      document.title = siteName || '';
    }

    this.$siteName.textContent = siteName || '';
  }

  async _renderContent(hash = '') {
    const url = hash.startsWith('#') ? hash.slice(1) : hash;

    const { html, headings } = await renderMarkdown(url || 'README.md');

    this.$post.innerHTML = html;
    this.$permalink.textContent = `原文连接：${location.href}`;
    this._emit('rendered');

    // 渲染文章后，回到顶部
    this._goBackToTop();

    setTimeout(() => {
      const $toc = document.querySelector('#toc');
      if (!$toc) {
        return;
      }

      const tocHtml = this._renderToc(headings);
      $toc.innerHTML = tocHtml;

      $toc.addEventListener('click', e => {
        const { target } = e;
        const headerId = target.dataset.headerId;
        if (!headerId) {
          return;
        }

        const el = document.getElementById(headerId.toLowerCase());
        scrollIntoView(el);
      });
    }, 0);
  }

  _renderToc(headings) {
    function buildHtml(headings) {
      const inner = headings.map(heading => {
        let subLevelHtml = '';
        if (heading.children.length > 0) {
          subLevelHtml = buildHtml(heading.children);
        }

        return `<li>
  <a class="toc-header level-${heading.level} clickable" data-header-id="${heading.id}" href="javascript:void(0)">
    ${heading.text}
  </a>
  ${subLevelHtml}
</li>`;
      });

      return `<ul>${inner.join('\n')}</ul>`;
    }

    const _headings = treeify(headings);
    return `<h2>目录</h2>${buildHtml(_headings)}`;
  }

  _emit(name) {
    console.log('#emit', name);
    const hooks = this._lifeCycleHooks[name] || [];
    setTimeout(() => hooks.forEach(it => it && typeof it === 'function' && it()), 0);
  }

  listen(name, fn) {
    if (!Array.isArray(this._lifeCycleHooks[name])) {
      this._lifeCycleHooks[name] = [];
    }

    this._lifeCycleHooks[name].push(fn);
  }

  render() {
    this._renderSidebarAndContent();
    this._renderCustomContent();
  }
}

const notes = new Marknote(window.marknoteConfig);
notes.listen('rendered', () => {
  console.log('try Prism#highlightAll');
  if (Prism && typeof Prism.highlightAll === 'function') {
    Prism.highlightAll(true);
  }
});

notes.render();
