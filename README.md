# 🎰 扭蛋 2048 · 合成生态

> **扭蛋机 × 2048 × 表情包** — 一边扭蛋一边合成的治愈系收集游戏
>
> 🎮 **在线游玩**：https://if3077-beep.github.io/emoji-2048-gashapon/

![游戏](https://img.shields.io/badge/version-v0.3.0-ff6b4a?style=for-the-badge)
![size](https://img.shields.io/badge/gzip-100KB-22c55e?style=for-the-badge)
![tests](https://img.shields.io/badge/tests-37%20passing-3b82f6?style=for-the-badge)

## ✨ 一句话玩法

> 扭蛋 → 抽到 emoji → 在 4×4 网格里**滑动**让相同的 emoji 合并 → 集齐 12 大生态区 → 觉醒成神。

## 🌟 核心特色

| 模块 | 说明 |
|------|------|
| 🎰 **3D 扭蛋机** | GSAP 摇杆/摇晃/出蛋，立体感拉满 |
| 🧬 **滑动合并** | 4×4 网格，触屏/键盘/鼠标三模操作 |
| 🌍 **12 大生态区** | 生物圈 / 植物界 / 元素殿 / 人文阁 / 美食街 / 星际航 / 音符符 / 建筑谱 / 神话殿 / 梦境海 / 复古厅 / 深蓝海 |
| ♾️ **无限觉醒** | Lv.11 后进入「觉醒·Ⅰ/Ⅱ/Ⅲ/...」无限循环 |
| 💥 **暴击爽感** | 5% 概率 ×5 倍奖励 + 红色屏幕震动 |
| 🌸 **季节活动** | 每日季节×2 + 幸运区×1.5，buff 主页可见 |
| 🐾 **宠物进化** | 🥚 蛋 → 幼崽 → 成体 → 觉醒（4 形态） |
| 📜 **12 章主线** | 通关 1 区解锁 1 新区，终章 20,000 币 |
| 💰 **慷慨奖励** | 觉醒 +500~10,000 币 + 暴击 + 季节 + 幸运区 |
| 🖼️ **主题弹层** | 8 主题不堆主页，三态可视化（未解锁/探索中/通关） |

## 🖼️ 截图

> 启动后：顶部货币 + 季节 buff 条 → 当前主题卡 → 扭蛋机 → 4×4 网格 → 任务

## 🎮 玩法循环

```
扭蛋（-1 币）
  ↓
随机 emoji 落入网格
  ↓
方向滑动 → 同色合成 → +1~10000 币
  ↓                            ↓
  货币足够 → 再扭蛋            合成到 Lv.10 → 宠物蛋 → 孵化
                                ↓
                          喂食 + 互动 → 进化（+50~5000 币奖励）
```

## 🛠 技术栈

- **React 18** + **TypeScript 5** + **Vite 5**
- **Tailwind CSS 3**（深色游戏风格）
- **Zustand 4**（game/ui 双 store）
- **GSAP 3**（扭蛋机/觉醒动效）
- **Web Audio API**（零文件音效合成）
- **Vitest 2**（37 单元测试）

## 🚀 本地运行

```bash
npm install --registry https://registry.npmmirror.com
npm run dev          # 启动开发服务器（端口 5180）
npm run build        # 生产构建
npm test             # 跑单元测试
```

## 📦 部署

项目已配置 GitHub Actions 自动部署：

1. 推送到 `main` 分支
2. `.github/workflows/deploy.yml` 自动 build + 部署
3. 访问 https://if3077-beep.github.io/emoji-2048-gashapon/ 即可游玩

## 📁 目录

```
src/
├── components/
│   ├── gashapon/    # 3D 扭蛋机
│   ├── grid/        # 4×4 滑动合并
│   ├── pet/         # 4 形态宠物进化
│   ├── collection/  # ZoneGallery 主题弹层
│   ├── tabs/        # 4 Tab 页
│   └── ui/          # CoinBurst / ComboMeter / Toaster / ...
├── store/           # gameStore + uiStore
├── lib/             # merge-engine / event-rewards / season / pet-gen / ...
├── data/            # emoji-trees（12 区）
└── styles/          # 7 keyframes（粒子/觉醒/连击/...）
```

## 📊 三个版本对比

| | v0.1 | v0.2 | v0.3 |
|---|---|---|---|
| 主题数 | 4 | 8 | **12** |
| 事件奖励 | 1 币 | 21 种 ×系数 | **24 种** + 暴击 |
| 滑动合并 | ❌ 拖拽 | ✅ 方向 | ✅ + 暴击/幸运特效 |
| 无限模式 | ❌ | ✅ 觉醒 Ⅰ~Ⅻ | ✅ + Lv.13+ 数字 |
| 宠物 | 蛋→固定 | 蛋→固定 | **4 形态进化** |
| 任务 | 3 每日 | 3 每日 | **3 每日 + 12 章节主线** |
| 主页结构 | 4 按钮 | 8 按钮 | **单卡片 + 弹层** |
| 季节/暴击 | — | — | ✅ ×15 倍率 |
| gzip | 91 KB | 97.94 KB | **100.72 KB** |
| 测试 | 33 | 37 | 37 |

详见 [VERSION_COMPARISON.md](./VERSION_COMPARISON.md) · [CHANGELOG.md](./CHANGELOG.md)

## 📜 许可

MIT
