# Alisa 的小宇宙

`src/pages/index.astro` 是唯一正式首页。根目录旧的独立 `index.html` 已移除，避免两套页面内容不一致。

## 本地预览与验证

安装 Node.js 后运行 `npm install`、`npm run dev`，在终端给出的本地地址预览页面。运行 `npm test` 检查内容结构和 Pages CMS 配置，运行 `npm run build` 检查并生成静态网站到 `dist/`。无需部署服务器或数据库即可本地开发。

## 内容管理准备

- `src/data/page.json`：首页、关于我、区块介绍、家长联系邮箱等文字，以及首屏图片。
- `src/data/works.json`：作品名称、分类、介绍和图片；可添加或调整卡片顺序。
- `src/data/daily.json`：日常卡片文字和图片。
- `.pages.yml`：Pages CMS 的编辑字段与图片上传位置。上传图片将存入 `public/images/`，页面使用 `/images/` 路径。

图片字段为空时，页面显示原有示例图；上传并保存图片后显示上传的图片。示例图来自外部服务，正式公开前建议由家长替换为有权发布的作品。请勿上传包含孩子学校、住址、固定行程或定位信息的图片。

当前只完成本地页面与 Pages CMS 配置，**尚未连接 GitHub、启用 Pages CMS 账号或发布到 Cloudflare Pages**。下一阶段需要先把仓库推送到 GitHub，再授权 Pages CMS 编辑该仓库，并让 Cloudflare Pages 从同一仓库构建 `dist/`。Pages CMS 保存内容会产生 Git 提交；发布前应检查测试和构建结果。
