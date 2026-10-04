# Alisa 的小宇宙

`src/pages/index.astro` 保留为中文首页；`/en/` 和 `/fr/` 分别提供英文和法文页面。三个地址共用 `src/components/PortfolioPage.astro`，顶部的「中 / EN / FR」可随时切换语言。根目录旧的独立 `index.html` 已移除。

## 本地预览与验证

安装 Node.js 和 pnpm 后运行 `pnpm install`、`pnpm dev`，在终端给出的本地地址预览页面。运行 `pnpm test` 检查内容结构和 Pages CMS 配置，运行 `pnpm build` 检查并生成静态网站到 `dist/`。无需部署服务器或数据库即可本地开发。

## 内容管理准备

- `src/data/page.json`、`page.en.json`、`page.fr.json`：分别管理中文、英文、法文的页面文字。中文文件中的首屏图片由三种语言共用。
- `src/data/works.json`：每件作品的三语名称、分类、介绍、封面和相册图片；可添加或调整卡片顺序。
- `src/data/daily.json`：每张日常卡片的三语文字、封面和相册图片。
- `.pages.yml`：Pages CMS 的编辑字段与图片上传位置。上传图片将存入 `public/images/`，页面使用 `/images/` 路径。

图片字段为空时，页面显示站内的中性占位图；上传并保存图片后显示上传的图片。样式、字体和占位图随网站一起发布，不依赖访客访问第三方 CDN 或随机图片服务。请勿上传包含孩子学校、住址、固定行程或定位信息的图片。

每张作品或日常卡片都有独立相册页。家长在 Pages CMS 的「相册照片」中逐张添加图片，并为每张填写一个英文照片名称（不含 `.jpg` 等后缀）；每个相册最多 30 张。照片名称在首页封面和相册照片悬停或键盘聚焦时显示，相册页当前大图下方也会显示，方便触屏查看。三种语言页面共用这一个英文名称。再在「封面图片」中选择相册内的一张；两处引用同一文件，不会复制图片。封面可以留空，此时自动使用相册第一张。若设置了封面，必须同时将该图片加入相册，否则测试和构建会报错。没有图片的相册显示空状态。`slug` 是相册网址标识，只能使用小写英文字母、数字和连字符，发布后不要随意修改，以免旧链接失效。

在 Pages CMS 中修改作品或日常时，请同时填写三种语言的文字；图片只需上传一次。直接访问 `/`、`/en/`、`/fr/` 即可预览对应语言；例如 `/works/cloud-puppy/`、`/en/works/cloud-puppy/` 和 `/fr/works/cloud-puppy/` 是同一相册的三种语言。相册内切换语言会保留当前相册。

项目已推送到 [GitHub 仓库](https://github.com/MichaelyaoKKK/nextjs-blog) 的 `main` 分支；原 Next.js 模板保存在 `backup/nextjs-blog-759fdbf` 分支。正式网址为 [alisayao.com](https://alisayao.com/)，由 Cloudflare Pages 连接 GitHub 自动构建发布，构建命令为 `pnpm test && pnpm run build`，输出目录为 `dist`。Pages CMS 保存内容会产生 Git 提交并触发发布；家长仍应在发布后检查图片、文字及隐私信息。

现有 [GitHub Pages](https://michaelyaokkk.github.io/nextjs-blog/) 工作流仍保留作旧链接和备用站点，构建时设置 `GITHUB_PAGES=true`，因此资源继续使用 `/nextjs-blog/` 路径。两边页面的 canonical 与多语言 alternate 均指向正式域名，避免旧站被视为另一组正式页面。如需让 `www.alisayao.com` 跳转到根域名，须在 Cloudflare 控制台添加 `www` DNS 记录和 301 重定向；仓库代码无法代替域名级 DNS 设置。
