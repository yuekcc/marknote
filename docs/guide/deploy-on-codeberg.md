# 部署到 codeberg pages

codeberg.org 是在德国一个组织提供的免费 git 托管服务。codeberg.org 也提供了类似 github pages 的服务，可以部署一些
静态的网站。

>codeberg.org 本身是使用 gitea 实现的服务，而 gitea 则是 fork 自 gogs 项目，gogs、gitea 都是开源的 git 自托管服务器软件。
>codeberg 由一个来自德国的非营利性的非政府组织所创建的，声称 codeberg 会保证独立性和可靠性，坚决避免对平台运行的商业、外部或专有服务的依赖。

[TOC]

## 创建 pages 仓库

codeberg.org 的 pages 服务需要用户创建一个 `pages` 仓库，其系统就会自动启动 pages 功能。

## 添加 git remote 配置

```sh
git remote add codeberg https://codeberg.org/yuekcc/pages
```

然后就可以 push 代码到 codeberg 的仓库：

```sh
git push --set-upstream codeberg master
```

## 访问

浏览器打开 https://yuekcc.codeberg.page/ 即可看到效果。

## 其他

关于 codeberg.org 的 pages 服务，可以查看官方文档：https://codeberg.page/

----

2021.11.5
