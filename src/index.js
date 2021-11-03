import 'github-markdown-css/github-markdown-light.css';
import marked from 'marked';
import 'minireset.css/minireset.css';
import './style.css';

const $ = document.querySelector.bind(document);

function fetchText(url) {
  return fetch(url).then(resp => {
    if (resp.ok) {
      return resp.text();
    }

    return Promise.resolve('');
  });
}

function renderMarkdown(url, defaultResult = 'not found') {
  return fetchText(url)
    .then(text => {
      if (text) {
        return marked(text);
      }

      return defaultResult;
    })
    .catch(() => {
      return defaultResult;
    });
}

class Marknote {
  constructor(config) {
    this._config = config;
    this.$sidebar = $('#sidebar');
    this.$post = $('#content');
    this.$menuSwitch = $('.sidebar-control button');
    this.$siteName = $('.site-name');
    this.$permalink = $('.permalink');

    this._menuIsShowing = false;

    window.addEventListener('popstate', () => {
      const [url, queryParams] = location.hash.split('?');
      this._renderContent(url);

      let sidebarFileName = 'SIDEBAR.md';
      if (queryParams) {
        const params = new URLSearchParams(queryParams);
        const name = params.get('sidebar');
        sidebarFileName = name || sidebarFileName;
      }

      this._renderSidebar(sidebarFileName);
    });

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

  _renderSidebar(sidebarFileName = 'SIDEBAR.md') {
    return renderMarkdown(sidebarFileName, '').then(html => {
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

        const hash = `#${url.pathname}${url.search}`;
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

  _renderContent(hash = '') {
    const url = hash.startsWith('#') ? hash.slice(1) : hash;
    return renderMarkdown(url || 'README.md')
      .then(html => {
        this.$post.innerHTML = html;
      })
      .then(() => {
        this.$permalink.textContent = `原文连接：${location.href}`;
      });
  }

  render() {
    this._renderSidebar();
    this._renderCustomContent();
    this._renderContent(location.hash);
  }
}

const notes = new Marknote(window.marknoteConfig);
notes.render();
