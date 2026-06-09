# 部署指南

## ✅ 当前部署：GitHub Pages（自动）

项目已配置 GitHub Actions 自动部署。推送到 `main` 分支即自动触发。

**在线地址**：https://if3077-beep.github.io/emoji-2048-gashapon/

### 部署流程

1. 推送代码到 `main`
2. `.github/workflows/deploy.yml` 自动运行：
   - 安装依赖（`npm ci`）
   - 构建（`GITHUB_PAGES=true npm run build` → vite base = `/emoji-2048-gashapon/`）
   - 上传 `dist/` 为 Pages artifact
3. 自动部署到 GitHub Pages

### 首次启用 Pages

1. 仓库 Settings → Pages
2. Source: **GitHub Actions**
3. 等待第一次 push 后自动部署

## 🛠 本地开发

```bash
npm install --registry https://registry.npmmirror.com
npm run dev        # http://localhost:5180
npm run build      # 输出到 dist/
npm test           # 跑 37 个单元测试
```

## 📦 手动部署到其他平台

构建产物在 `dist/` 目录，是纯静态文件，可上传到任何静态托管：

- **Vercel**：`vercel --prod`
- **Netlify**：拖拽 `dist/` 到控制台
- **Cloudflare Pages**：连接 GitHub 自动部署

## ✅ 验证清单

- ✅ TypeScript 严格模式 0 错误
- ✅ 37 个单元测试通过
- ✅ 生产构建 100.72 KB gzip
- ✅ Dev server 启动正常（端口 5180）
- ✅ 移动端响应式 + 触屏
- ✅ localStorage 自动存档
- ✅ 季节/暴击/幸运区/觉醒循环均工作
