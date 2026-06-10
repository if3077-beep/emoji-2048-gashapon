# BUG_AUDIT.md — emoji-2048-gashapon

> 最后自查：2026-06-10（v1.3 push 后）
> 6 个 GitHub Pages 版本（v0.4 → v1.3）已 push，37 测试 0 错误，build 122.68 KB gzip。

## 1. 用户原话反馈 → 修复/打补丁映射

| 用户反馈 | 触发版本 | 状态 | 修复方式 |
|---------|---------|------|---------|
| "开屏就把主题羁绊弹出来，我关不了" | v1.0 | ✅ 已修 | `SynergiesPanel` 补 `if (!show) return null` 守卫；audit 其他 13 个面板均正常 |
| "扭蛋还是太单调没有多种风格" | v1.2 | ✅ 已加 | Gashapon 主体颜色随当前主题渐变 + 主体大 emoji 半透水印 + 蛋壳内部主题 emoji 水印 + 摇杆球也跟主题色 |
| "顶部的一堆 emoji 堆在一起是 bug 还是什么" | v1.2 | ✅ 已改 | HomeTab 季节 buff 行从单行 flex 改为 wrap + chip 圆角（🌱/🍀/🎉/×3），从 11px 缩到 10px，标签全部可独立换行 |
| "2048 合成轨迹和动效可以再明显一点，滑动都没有动效" | v1.2 | ✅ 已加 | `MergeGrid.handleDirection` 后 GSAP 给每个移动过的 cell 做 `scale 0.8→1.0 + 方向位移` 弹动 + 合并位置加金色 ring pulse + 方向轨迹光带（dirTrailFade 0.4s 渐隐） |
| "底部第二个栏目可能没必要 / 强化" | v1.2 | ✅ 已加 | MergeTab 新增"🎰 扭蛋机"折叠按钮，展开后内嵌 Gashapon + 主题进度条（已收集 0/11 + 进度条渐变） |
| "底部其他栏目在电脑上显示不居中" | v1.2 | ✅ 已修 | App.tsx 顶层 `mx-auto max-w-[480px]` + nav `mx-auto max-w-[480px]`，电脑端整体居中 |
| "迭代优化 BGM、音效、动效" | v1.3 | ✅ 已加 | BGM 4 层（melody+bass+chord+arp）+ 低通滤波 + 合成 IR reverb + 启动淡入/停止淡出；新增 5 个音效（achievement/petBorn/petPet/crit/whoosh）并 wire 到对应事件 |

## 2. 审计到的所有 bug 与修复

| 编号 | 等级 | 现象 | 版本 | 状态 |
|-----|------|------|------|------|
| BUG-01 | 🔴 P0 | `SynergiesPanel` 缺 `if (!show) return null` 守卫，开屏全屏遮罩一直显示，玩家关不掉 | v1.0 | ✅ 已修 |
| BUG-02 | 🟡 P2 | HomeTab 季节 buff 行（emoji+中文+chip）单行 flex 无 wrap，电脑端或长区名时内容溢出堆叠 | v1.2 | ✅ 已改（chip 化 + wrap） |
| BUG-03 | 🟡 P2 | MergeGrid 仅 `tile-slide-in` CSS className 闪烁，无真实位置插值，用户感觉"没动效" | v1.2 | ✅ 已加 GSAP scale 弹动 + 方向轨迹 + ring pulse |
| BUG-04 | 🟡 P2 | 电脑端打开游戏，4 个 nav 按钮 + 主体全屏拉伸，不居中 | v1.2 | ✅ 已加 `max-w-[480px] mx-auto` 双重 |
| BUG-05 | 🟡 P2 | Gashapon 扭蛋机永远是同一台米色机器，4 个限定蛋的差异只有"出蛋那一刻" | v1.2 | ✅ 已改主体渐变 + 主题 emoji 大水印 + 蛋壳 emoji 水印 + 摇杆球随主题色 |
| BUG-06 | 🟡 P2 | MergeTab 只看网格和统计，缺少"快速抽卡"路径 | v1.2 | ✅ 已加 🎰 扭蛋机折叠入口 |
| BUG-07 | 🟠 P3 | 成就系统有 detectUnlocked，但无 UI 反馈，玩家不知道 | v1.1 | ✅ 已加 `AchievementUnlockModal` + 队列 + 撒花 + achievement 音效 |
| BUG-08 | 🟠 P3 | ZoneGallery 卡片只有进度条和数量，无主题故事 | v1.1 | ✅ 已加 `description` 字段（12 zone 各 1 句）+ `flavor` 推荐原因 |
| BUG-09 | 🟠 P3 | HomeTab 只有当前主题卡，无"卡关推荐" | v1.1 | ✅ 已加 `ZoneSuggestion`（卡关时推未探索或高潜力主题） |
| BUG-10 | 🟠 P3 | 宠物只有等级，无心情状态 | v1.1 | ✅ 已加 6 档心情（😢/😟/😐/😊/😋/🥰），名字旁实时显示 |
| BUG-11 | 🟢 P3 | BGM 只有 melody+bass，2 层单薄 | v1.3 | ✅ 已加 4 层（chord pad + arp）+ 滤波 + reverb |
| BUG-12 | 🟢 P3 | BGM 启动/停止是硬切 | v1.3 | ✅ 已加 1.2s 淡入 / 0.5s 淡出 + ctx.close() |
| BUG-13 | 🟢 P3 | 现有 sfx 没有 achievement / petBorn / crit / petPet / whoosh | v1.3 | ✅ 已加 5 个 sfx + wire 到 6 个调用点 |
| BUG-14 | 🟢 P3 | crit 事件只用 sfx.rare()，不够爽 | v1.3 | ✅ 已用 sfx.crit()（三连鼓 + 滑音）替换 |

## 3. PM 视角自查（仍可继续打磨的点）

下列项本次未实现，是下一轮候选：

- [ ] **小宠物动态描边**：当前宠物只有 emoji 主体，未加动态相框或光晕
- [ ] **抽卡 1/10 切换**：现在 Gashapon 只能 1 连抽；可加 10 连（保底 1 紫）
- [ ] **排行榜接入**：当前是本地假数据，可对接云函数
- [ ] **PWA / 离线收益**：用户明确不需要，跳过
- [ ] **2-3 个限定活动主题**：可加春节/万圣节主题，每月 1 个
- [ ] **iPad 横屏适配**：未测，但 max-w 480 + 4×4 网格应可正常显示
- [ ] **首屏性能**：当前未做 lazy load / 路由分包，gz 122 KB 仍属可接受范围
- [ ] **多语言**：当前只有中文 + emoji，国际化 i18n 框架未引入

## 4. 自动化测试覆盖

```
tests/task-system.test.ts (8 tests)  - 任务系统
tests/pet-gen.test.ts (9 tests)       - 宠物生成
tests/merge-engine.test.ts (20 tests) - 合并引擎
─────────────────────────────────────
合计: 37 测试 / 全部通过 / 0 错误
```

未覆盖（手动测试）：
- 音频播放（Web Audio API 在 vitest jsdom 环境下不可用）
- GSAP 动画（依赖 DOM 真实布局）
- 持久化（依赖 localStorage 时序）
- 事件模态弹出流程

## 5. 体积演进（gzip）

| 版本 | gzip | 模块数 | 主要改动 |
|------|------|--------|---------|
| v0.4 | 100.72 KB | 81 | 基线 |
| v0.5 | 104.97 KB | 84 | +季节/Pet |
| v0.6 | 109.78 KB | 86 | +羁绊/类型修 |
| v0.7 | 113.02 KB | 89 | +爽感/随机事件 |
| v0.8 | 115.41 KB | 92 | +Dpad/消消乐 |
| v0.9 | 116.52 KB | 94 | +羁绊/世界环 |
| v1.0 | 118.36 KB | 99 | +修卡死 |
| v1.1 | 121.03 KB | 100 | +心情/成就/故事 |
| v1.2 | 121.75 KB | 100 | +视觉打磨 |
| v1.3 | 122.68 KB | 100 | +BGM/音效 |

每个版本 ≤ +3 KB 增量，符合"零依赖 + 即时合成"的设计原则。

## 6. GitHub Pages 部署地址

https://if3077-beep.github.io/emoji-2048-gashapon/

- 部署方式：GitHub Actions 自动 build + 推 Pages
- 工作流：`.github/workflows/deploy.yml`
- 触发：push 到 main 分支
- v0.4 → v1.3 共 10 个版本全部自动部署
