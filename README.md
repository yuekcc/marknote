# marknote

一个简单的 github pages 主页

## 使用

首先是 git clone 这个项目，然后打开你喜欢编辑器，然后就可以开始写作了。

文章建议放在 `docs` 目录下，文件名推荐使用英文（使用中文的文件名也应该可以的）

## 约定

1. 整个页面基本是手工编辑的。固定的文件主要有 `SIDEBAR.md` 和 `README.md`
2. 主页是 `README.md`，如同 github 的仓库
3. `SIDEBAR.md` 是侧栏的内容。一般用作目录使用

## 修改样式、二次开发

核心代码在 [src/index.js](src/index.js)，需要使用 nodejs 进行构建。全部样式目前都在 [src/style.css](src/style.css)。

## LICENSE

[MIT](LICENSE)

## 致谢

样式使用了 [typo.css](https://typo.sofi.sh/) 项目，中文阅读也有不错的体验。
