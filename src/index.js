import marked from 'marked';

import 'minireset.css/minireset.css';
import 'github-markdown-css/github-markdown-light.css';
import './layout.css';
import './style.css';
import './print.css';

const $ = document.querySelector.bind(document);

const renderer = {
  paragraph(text) {
    if (text === '[TOC]') {
      return `<p id="toc"></p>`;
    }

    return `<p>${text}</p>`;
  },
};

marked.use({ renderer });

function _renderMarkdown(text) {
  const headings = [];
  const walkTokens = token => {
    if (token.type === 'heading') {
      headings.push({
        level: token.depth,
        text: token.text,
        id: token.text,
      });
    }
  };

  marked.use({ walkTokens });
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

async function renderMarkdown(url, defaultResult = 'not found') {
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

    this._menuIsShowing = false;

    window.addEventListener('popstate', this._renderSidebarAndContent.bind(this));
    this.$menuSwitch.addEventListener('click', this._clickOnMenu.bind(this));
  }

  _clickOnMenu() {
    if (this._menuIsShowing) {
      this.$sidebar.classList.remove('showing');
    } else {
      this.$sidebar.classList.add('showing');
    }

    this._menuIsShowing = !this._menuIsShowing;
  }

  _renderSidebarAndContent() {
    const [url, queryParams] = location.hash.split('?');
    this._renderContent(url);

    let sidebarFileName = 'SIDEBAR.md';
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      const name = params.get('sidebar');
      sidebarFileName = name || sidebarFileName;
    }

    this._renderSidebar(sidebarFileName);
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

        const hash = `#${url.pathname}?${url.searchParams}`;
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

    setTimeout(() => {
      const tocHtml = this._renderToc(headings);
      const $toc = document.querySelector('#toc');
      $toc.innerHTML = tocHtml;

      $toc.addEventListener('click', ({ target }) => {
        const headerId = target.dataset.headerId;
        if (!headerId) {
          return;
        }

        document.getElementById(headerId.toLowerCase()).scrollIntoView({ block: 'start', inline: 'nearest' });
      });
    }, 0);
  }

  _renderToc(headings) {
    const inner = headings
      .map(
        heading =>
          `<li><a class="toc-header level-${heading.level} clickable" data-header-id="${heading.id}">${heading.text}</a></li>`,
      )
      .join('');

    return `<h2>目录</h2><ul>${inner}</ul>`;
  }

  render() {
    this._renderSidebarAndContent();
    this._renderCustomContent();
  }
}

const notes = new Marknote(window.marknoteConfig);
notes.render();
