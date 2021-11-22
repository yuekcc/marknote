function _hash(str) {
  if (!str || typeof str !== 'string') return 0;
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = ((result << 5) - result + str.charCodeAt(i)) | 0;
    result = result & result;
  }
  return result;
}

export function makeId(str) {
  return `hash-` + _hash(str);
}

/**
 *  将 heading 数据，重构为树结构
 *
 * 原来是平铺的结果，改为将子节点卷上最近的父节点
 * 比如有 levels 的平铺数据：1 2 3 3 3 3 2 2 2 => {level: 1, children: [ { level: 2, children: [3 3 3 3 3]}, {level: 2}, {level: 2}]}
 * @param {Array<{level: number; children: any[]; text: string; id: string}>} headings
 */
export function treeify(headings) {
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

export function updateInnerHtml(el, html) {
  if (el) {
    el.innerHTML = html || '';
  }
}

export function scrollIntoView(el, options = {}) {
  el &&
    el.scrollIntoView &&
    typeof el.scrollIntoView === 'function' &&
    el.scrollIntoView({ block: 'start', inline: 'nearest', ...options });
}
