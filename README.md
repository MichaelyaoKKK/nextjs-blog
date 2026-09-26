# Alisa 的小宇宙

`src/pages/index.astro` 保留为中文首页；`/en/` 和 `/fr/` 分别提供英文和法文页面。三个地址共用 `src/components/PortfolioPage.astro`，顶部的「中 / EN / FR」可随时切换语言。根目录旧的独立 `index.html` 已移除。

## 本地预览与验证

安装 Node.js 和 pnpm 后运行 `pnpm install`、`pnpm dev`，在终端给出的本地地址预览页面。运行 `pnpm test` 检查内容结构和 Pages CMS 配置，运行 `pnpm build` 检查并生成静态网站到 `dist/`。无需部署服务器或数据库即可本地开发。

## 内容管理准备

- `src/data/page.json`、`page.en.json`、`page.fr.json`：分别管理中文、英文、法文的页面文字。中文文件中的首屏图片由三种语言共用。
- `src/data/works.json`：每件作品的三语名称、分类、介绍和共用图片；可添加或调整卡片顺序。
- `src/data/daily.json`：每张日常卡片的三语文字和共用图片。
- `.pages.yml`：Pages CMS 的编辑字段与图片上传位置。上传图片将存入 `public/images/`，页面使用 `/images/` 路径。

图片字段为空时，页面显示站内的中性占位图；上传并保存图片后显示上传的图片。样式、字体和占位图随网站一起发布，不依赖访客访问第三方 CDN 或随机图片服务。请勿上传包含孩子学校、住址、固定行程或定位信息的图片。

在 Pages CMS 中修改作品或日常时，请同时填写三种语言的文字；图片只需上传一次。直接访问 `/`、`/en/`、`/fr/` 即可预览对应语言。语言切换会返回目标语言首页。

项目已推送到 [GitHub 仓库](https://github.com/MichaelyaoKKK/nextjs-blog) 的 `main` 分支；原 Next.js 模板保存在 `backup/nextjs-blog-759fdbf` 分支。[GitHub Pages](https://michaelyaokkk.github.io/nextjs-blog/) 会通过 `.github/workflows/deploy.yml` 自动测试、构建并发布三种语言的页面。Pages CMS 保存内容会产生 Git 提交并触发同一部署流程；家长仍应在发布后检查图片、文字及隐私信息。
