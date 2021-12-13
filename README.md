# marknote

一个简单的 github pages 主页。

特性：

- [x] 极简主义
  - [x] 极简主题
    - [x] 支持大屏、小屏设备
    - [x] 打印优化，方便导出文章为 PDF 文件
  - [x] 手工实现文章关联
  - [x] 支持 markdown 书写文章
    - [x] 支持 `[TOC]` 拓展，可以自动抽取文章中 h1、h2 标题行，生成目录
- [x] 纯前端项目，无后台服务 **不支持 SEO，也不计划支持**

[TOC]

## 使用

首先是 `git clone` 这个项目，然后打开你喜欢编辑器，可以开始写作了。

## 约定

- 整个页面基本是手工编辑的。固定的文件主要有 `SIDEBAR.md` 和 `README.md`
  - `README.md` 是主页，如同 github 的仓库
  - `SIDEBAR.md` 是侧栏的内容。一般用作目录使用
- 文章应该统一放置到 `docs` 目录下
  - docs 目录里的内容可以自由组织

## 自定义配置

所有自定义的配置内容都在 `index.html` 里的 `window.marknoteConfig` 代码。

```js
window.marknoteConfig = {
  siteName: '站点名称' // 网站的名称，最终会显示为窗口的标题及顶部导航的左则
  basePath: '/marknote/' // 网站的基本地址，应该以 `/` 结尾，未配置时默认为 `/`
}
```

## 侧栏

现在已经支持多个侧栏文件，默认使用 `SIDEBAR.md`，通过的连接中指定 `sidebar=xxxx.md` 可以指定使用侧栏文件。

如： 

在 `index.html` 中

```html
<!-- ... -->
<a href="/#/docs/deploy-on-github.md?sidebar=guide-sidebar.md">部署</a>
<!-- ... -->
```

在 `SIDEBAR.md` 中也支持指定侧栏：

```md
- [部署](docs/guide/deploy-on-github.md?sidebar=docs/guide/SIDEBAR.md)
```

**访问自定义侧栏时，同一侧栏内的连接会自动设置为同一个侧栏**，可以少写一些 `?sidebar=xxxx` 参数。

## 修改样式、二次开发

核心代码在 [src/index.js](src/index.js)，需要使用 nodejs 进行构建。全部样式目前都在 [src/styles](src/styles)。

## 快速修改样式

在 `index.html` 的 body 标签中增加 `style="--top-nav-bgc: var(--color-ryf); --content-bgc: var(--color-ryf);"`
可以使用内置的“护眼色”。

## LICENSE

[MIT](LICENSE)
