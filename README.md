# 🎰 扭蛋 2048 · 合成生态

> **扭蛋机 × 2048 × 表情包** — 一边扭蛋一边合成的治愈系收集游戏
>
> 🎮 **在线游玩**：https://if3077-beep.github.io/emoji-2048-gashapon/

![游戏](https://img.shields.io/badge/version-v0.9.0-ff6b4a?style=for-the-badge)
![size](https://img.shields.io/badge/gzip-118KB-22c55e?style=for-the-badge)
![tests](https://img.shields.io/badge/tests-37%20passing-3b82f6?style=for-the-badge)

## ✨ 一句话玩法

> 扭蛋 → 抽到 emoji → 在 4×4 网格里**滑动**让相同的 emoji 合并 → 集齐 12 大生态区 → 觉醒成神。

## 🌟 核心特色

| 模块 | 说明 |
|------|------|
| 🎰 **3D 扭蛋机** | GSAP 摇杆/摇晃/出蛋，4 款限定蛋壳（钻石/星辰/樱花/暗夜） |
| 🧬 **滑动合并** | 4×4 网格，触屏/键盘/鼠标/**Dpad 方向按钮** 四模操作 |
| 🌍 **12 大生态区** | 生物圈 / 植物界 / 元素殿 / 人文阁 / 美食街 / 星际航 / 音符符 / 建筑谱 / 神话殿 / 梦境海 / 复古厅 / 深蓝海 |
| 🔗 **6 对主题羁绊** | 双方 Lv.10+ 解锁被动（+10% 收益 / +2% 暴击 / +5% 幸运） |
| 🌍 **世界进度环** | 12 主题按段绘，凑齐整圈解锁「传说蛋」 |
| ♾️ **无限觉醒** | Lv.11 后进入「觉醒·Ⅰ/Ⅱ/Ⅲ/...」无限循环 |
| ⚡ **一键合并** | 贪心反复滑动，最多 6 轮，3 连预提示 |
| 💥 **暴击爽感** | 5% 概率 ×5 倍奖励 + 红色屏幕震动 |
| 🎁 **8 种随机事件** | 宠物撒娇/元素共鸣/时间倒流/双倍时段/连击风暴/扭蛋狂欢/守护之盾/神秘访客 |
| 🌟 **神赐事件** | 8% 概率直接送 Lv.6 棋子 |
| 🌸 **季节活动** | 每日季节×2 + 幸运区×1.5 + 周末 ×2 |
| 🐾 **宠物早产** | Lv.4 → 蛋，Lv.5 → 孵化（2 分钟内必拿） |
| 📜 **12 章主线** | 通关 1 区解锁 1 新区，终章 20,000 币 |
| 💰 **慷慨奖励** | 觉醒 +500~10,000 币 + 暴击 + 季节 + 幸运区 + 周末 + 主题羁绊 |
| 🏆 **40+ 成就** | 6 大类：merge/collect/gacha/pet/combo/awaken |
| 📅 **7 日签到** | 主页 🎁 入口 + 连续登录奖励 |
| 🖼️ **9:16 分享卡片** | Canvas 生成 PNG，一键分享到社媒 |
| 🏅 **本地排行榜** | 多玩家并存，3 榜单：连击/等级/通关 |
| 🎨 **主题展示墙** | 12 主题 + Lv.10+ emoji 弹层 + 故事 |

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

## 📊 三个版本对比（v0.7 / v0.8 / v0.9）

| | v0.7 爽感 | v0.8 操作 | v0.9 羁绊 |
|---|---|---|---|
| 核心命题 | 一上来就爽？ | 移动端也顺？ | 主题不孤岛？ |
| 宠物早产 | ✅ Lv.4 出蛋 | ✅ | ✅ |
| 一键合并 | ✅ 6 轮贪心 | ✅ | ✅ |
| 8 种随机事件 | ✅ | ✅ | ✅ |
| Dpad 方向按钮 | — | ✅ | ✅ |
| 消消乐 3 连 | — | ✅ | ✅ |
| 4 款限定蛋 | — | ✅ | ✅ |
| 神赐事件 | — | ✅ | ✅ |
| 6 对主题羁绊 | — | — | ✅ |
| 世界进度环 | — | — | ✅ |
| 视觉打磨工具 | — | — | ✅ |
| gzip | 115.41 KB | 116.52 KB | **118.34 KB** |

详见 [VERSION_COMPARISON_V789.md](./VERSION_COMPARISON_V789.md) · [CHANGELOG.md](./CHANGELOG.md)

## 📜 许可

MIT
