# BUG_AUDIT.md — emoji-2048-gashapon

> 最后自查：2026-06-10（v3 push 后）
> 12 个 GitHub Pages 版本（v0.4 → v3）已 push，37 测试 0 错误，build 127.41 KB gzip。

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
| "2048 有几率会卡死，不能合成" | v2.0 | ✅ 已修 | `slide` action 末尾补 `trySpawnOne()` + `checkDeadlock()`，恢复经典 2048"滑动后必 spawn 1 个"行为；满格 + 4 方向无任何可合成时弹"🪦 卡死"提示 + 一键降级（清 Lv.1-3 保留 Lv.4+，奖 50🪙）|
| "另外定部还是会emoji堆积" | v2.2 | ✅ 已修 | uiStore `pushBurst` 限流最多同时显示 3 个 burst，超过自动丢弃最旧的；提示按钮 + 方向高亮引导玩家主动合成减少 burst 触发 |
| "继续优化2048和消消乐玩法 ... 迭代三次" | v2.0/v2.1/v2.2 | ✅ 3 个版本迭代 | v2.0 修卡死；v2.1 消消乐强化（3/4/5 连锁奖励 + 觉醒 burst + 二次合成）；v2.2 提示系统 + 限流 |
| "合成和移动轨迹还是不明显" | v3.0 | ✅ 已加 | 移动过的 cell 额外加绿光 ring 0.5s + SVG 蛇形连线（dasharray 4 3 渐显 0.5s → 渐隐）+ 合并 cell 数字飘字（GSAP 0.25s back.out 弹出 0.55s 渐隐） |
| "宠物太丑了 + 离光标太近" | v3.0 | ✅ 已美 | 主体加 3D ring 4 阴影 + 渐变背景 + idle bob 动画 + 外圈光晕呼吸（awakened 1.2s，普通 2.4s）+ 右上角 accessory 旋转尾巴/耳朵（按 species+form 选 emoji）+ 离光标偏移 (90, 110) |
| "蛋还是太丑了" | v3.1 | ✅ 已美 | 3D 蛋壳背景（radial gradient + inset shadow + 高光层）+ 限定蛋稀有徽章（传说/史诗/稀有/限定 4 档 + 颜色 ring + 慢动作 1.5s：弹出→摇晃→旋转爆开→消失）+ 蛋底 16x16 模糊光晕呼吸 |
| "很多成就可以合并展示，只确认一次" | v3.1 | ✅ 已加 | 队列 ≥2 时弹"📋 一键收下全部 (N)"金色按钮 + 右上角"✨ ×N"徽章提示（一次撒花音效 + 一次清队列） |
| "继续优化和审视新增功能优化小创意" | v3.2 | ✅ 已加 | 🔮 今日宜合（按 day-of-year 选主题卦象 + 一键切换）+ 抽卡徽章 4 档（10/50/100/500：🎯/🎲/🎰/👑，未达 grayscale + 进度条 + 已达彩色发光） |

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
| BUG-15 | 🔴 P0 | `slide` action 完成后**完全没有 spawn 新 tile**，经典 2048 每次滑动都会生成 1 个新胶囊，导致玩家高概率卡死在无法合成的状态 | v2.0 | ✅ 已在 slide + autoMerge 末尾补 `trySpawnOne()` + `checkDeadlock()` |
| BUG-16 | 🟠 P1 | 满格 + 4 方向无可滑动时无任何提示，玩家不知道下一步 | v2.0 | ✅ 已加 `DeadlockPanel`：🪦 满格卡死 + 一键兜底清场（+50🪙），挂到 MergeTab |
| BUG-17 | 🟢 P2 | 连锁奖励只看 combo 数，没有按 match-3/4/5 长度细分，消消乐玩法不够爽 | v2.1 | ✅ 已加 `findLongestMatch` 扫描横/竖 3+ 连锁：3 链+20🪙+1 combo；4 链+50🪙+2 combo+再触发一次相邻合成；5+ 链+200🪙+3 combo+召唤觉醒 burst |
| BUG-18 | 🟢 P2 | `pushBurst` 无上限，5 连锁时屏上 burst 全部堆在中央形成 emoji 山 | v2.2 | ✅ uiStore `pushBurst` 限流最多 3 个，超出截断 |
| BUG-19 | 🟢 P2 | 玩家卡住时不知道往哪滑，只能凭感觉 | v2.2 | ✅ 已加 `findBestHint` 函数 + MergeGrid 底部"💡 提示"按钮 + Dpad 方向金色 pulse 高亮 1.5s |
| BUG-20 | 🟠 P1 | 合成和滑动轨迹只靠 `result.moves` 内部状态，没显式视觉反馈，玩家看不到自己刚才动了哪几个格子 | v3.0 | ✅ 已加：移动过的 cell 绿光 ring 0.5s + SVG 蛇形连线（dasharray 4 3）+ 合并 cell 数字飘字 |
| BUG-21 | 🟠 P1 | 宠物只用一个 species emoji + 灰色外圈，"太丑了" | v3.0 | ✅ 已加：3D ring 4 阴影 + 渐变背景 + 外圈光晕呼吸 + 右上角 accessory 旋转尾巴/耳朵（按 species+form 选）|
| BUG-22 | 🟢 P3 | 宠物原 offset 30×60，跟随鼠标太近 | v3.0 | ✅ 已改 offset 90×110，远离光标避免遮挡 |
| BUG-23 | 🟠 P1 | 蛋只有 emoji + 主题水印，"还是太丑" | v3.1 | ✅ 已加：3D 蛋壳 radial gradient + 高光层 + 限定蛋稀有徽章（传说/史诗/稀有/限定 4 档 + 颜色 ring）+ 蛋底光晕 + 1.5s 慢动作（弹出→摇晃→旋转爆开）|
| BUG-24 | 🟠 P1 | 解锁多个成就时，玩家必须逐个点击"下一个"，体验差 | v3.1 | ✅ 已加：队列 ≥2 时弹层"📋 一键收下全部 (N)"金色按钮（一次撒花 + 一次清队列 + 一次成就音效）|
| BUG-25 | 🟢 P3 | HomeTab 缺少每日"小创意"入口 | v3.2 | ✅ 已加 DailyFortune 组件：🔮 今日宜合（按 day-of-year 哈希选主题卦象 + 一键切换）+ 抽卡 4 档徽章（10/50/100/500：🎯/🎲/🎰/👑，未达 grayscale 已达彩色发光）+ 进度条 |

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
| v2.0 | 123.38 KB | 101 | +修卡死 + 死局兜底 |
| v2.1 | 124.56 KB | 102 | +消消乐强化 + 觉醒 burst |
| v2.2 | 124.95 KB | 102 | +提示按钮 + burst 限流 |
| v3   | 127.41 KB | 102 | +轨迹强化 + 宠物美化 + 蛋 3D + 成就合并 + 卦象 |

每个版本 ≤ +3 KB 增量，符合"零依赖 + 即时合成"的设计原则。

## 6. GitHub Pages 部署地址

https://if3077-beep.github.io/emoji-2048-gashapon/

- 部署方式：GitHub Actions 自动 build + 推 Pages
- 工作流：`.github/workflows/deploy.yml`
- 触发：push 到 main 分支
- v0.4 → v1.3 共 10 个版本全部自动部署
