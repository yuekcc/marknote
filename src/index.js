import marked from 'marked';
import './styles';

function _hash(str) {
  if (!str || typeof str !== 'string') return 0;
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = ((result << 5) - result + str.charCodeAt(i)) | 0;
    result = result & result;
  }
  return result;
}

function makeId(str) {
  return `hash-` + _hash(str);
}

/**
 *  将 heading 数据，重构为树结构
 *
 * 原来是平铺的结果，改为将子节点卷上最近的父节点
 * 比如有 levels 的平铺数据：1 2 3 3 3 3 2 2 2 => {level: 1, children: [ { level: 2, children: [3 3 3 3 3]}, {level: 2}, {level: 2}]}
 * @param {Array<{level: number; children: any[]; text: string; id: string}>} headings
 */
function treeify(headings) {
  let root = {
    level: 1,
    children: [],
  };

  let visited = [root];
  function top() {
    return visited[visited.length - 1];
  }

  let i = 0;
  while (i < headings.length) {
    const parent = top();
    const cur = headings[i];

    if (parent.level < cur.level) {
      parent.children.push(cur);
      visited.push(cur);
      i++;
      continue;
    }

    if (parent.level >= cur.level) {
      visited.pop();
      continue;
    }

    i++;
  }

  return root.children;
}

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

    this._menuIsShowing = false;

    window.addEventListener('popstate', this._renderSidebarAndContent.bind(this));
    this.$menuSwitch.addEventListener('click', this._clickOnMenu.bind(this));
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

      $toc.addEventListener('click', e => {
        const { target } = e;
        const headerId = target.dataset.headerId;
        if (!headerId) {
          return;
        }

        document.getElementById(headerId.toLowerCase()).scrollIntoView({ block: 'start', inline: 'nearest' });
      });
    }, 0);
  }

  _renderToc(headings) {
    console.log(headings);

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

  render() {
    this._renderSidebarAndContent();
    this._renderCustomContent();
  }
}

const notes = new Marknote(window.marknoteConfig);
notes.render();
