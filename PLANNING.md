# v0.4 / v0.5 / v0.6 迭代规划（PM 视角）

> 用户场景：你打开游戏 5 分钟 → 玩了一会 → 关掉。明天会不会想回来？一个月后呢？
> 这三个版本的目标是**让留存曲线从"陡降"变成"长尾"**。

## v0.3 → 留存短板诊断

| 问题 | 症状 | 影响 |
|------|------|------|
| 没有"想打开"的理由 | 玩过一轮后无目标 | 次日留存低 |
| 没有"想达 100%"的钩子 | 集齐 12 区后无事可做 | 7 日留存极低 |
| 没有"想分享"的内容 | Lv.10 合成悄无声息 | 拉新 = 0 |
| 玩家长时间离开无感知 | 不知道宠物在想你 | 不会回归 |
| 玩家长时间在游戏内无事可做 | 5 分钟后迷茫 | 时长 < 5min |

---

## v0.4 — 留存与日活（让用户"每天想来"）

**核心命题**：用户今天会想登录吗？

| 功能 | 描述 | 预期效果 |
|------|------|----------|
| **🎁 7 日签到** | 每天登录 1 次，第 7 天送限定宠物装扮。错过 1 天 = 断签 | 次日 +7 日留存 |
| **🔥 连续 7 日挑战** | 每天 3 个"高于日常"任务，奖励翻倍 | 周活 |
| **🐾 回归欢迎动画** | 上次登录 > 24h → 宠物"想你" + 大礼包 | 流失用户召回 |
| **📊 数据面板** | 累计扭蛋/历史最高/收集率/宠物好感度曲线 | 自我认同 |
| **🚀 启动页"今日推荐"** | 进入时显示"今日幸运区+季节"+ "今日 1 个专属任务" | 启动引导 |
| **🌙 离线预告** | 关页面前 5s 显示"宠物晚安" | 情感连接 |

**验收**：连续登录 7 天可解锁限定宠物装扮，3 日回归用户打开率 ≥ 30%。

---

## v0.5 — 成就与深度（让用户"想达 100%"）

**核心命题**：用户明天还会回来继续吗？

| 功能 | 描述 | 预期效果 |
|------|------|----------|
| **🏆 50+ 成就系统** | 6 类：合成/收集/扭蛋/宠物/连击/觉醒。每类 8-10 个 | 长线内容 |
| **🎨 宠物装扮 3 套** | 节日套装（圣诞帽）/ 生日（皇冠）/ 季节（樱花） | 个性化 |
| **😺 宠物动作库** | 12+ 表情动作：睡觉/洗澡/跳跃/思考/唱歌/害羞/... | 互动深度 |
| **📖 图鉴故事** | 每个 Lv.11 物品配 1 段 50 字背景故事 | 情感投入 |
| **🎵 3 首 BGM** | 休闲/战斗/觉醒场景，循环播放 | 沉浸感 |
| **⚙️ 设置面板** | 音乐/音效/震动/主题/语言 | 自由度 |

**验收**：成就解锁总数 ≥ 30，平均游玩时长 ≥ 8min。

---

## v0.6 — 社交与分享（让用户"想秀"）

**核心命题**：用户会拉朋友来玩吗？

| 功能 | 描述 | 预期效果 |
|------|------|----------|
| **🖼️ 分享卡片** | 合成 Lv.10+ 自动生成 9:16 卡片（emoji+等级+季节+宠物+水印） | 拉新 |
| **🏠 收藏展示墙** | CollectionTab 改造：右侧 4 列大图预览，点开看故事 | 成就可视化 |
| **🐾 宠物社交** | 宠物可"出门" → 生成分享码 → 朋友扫码看到你的宠物 | UGC 钩子 |
| **🏅 本地排行榜** | bestCombo / maxLevel / zoneMax 总和 | 竞争 |
| **🎁 周末双倍** | 周六周日货币 ×2 | 周活 |
| **📦 限定内容** | 月度限定：每月 1 个新区 + 1 个限定宠物 | 拉回 |

**验收**：分享卡生成率 ≥ 10%，限定区解锁率 ≥ 30%。

---

## 三个版本的依赖关系

```
v0.4 留存   ──→  v0.5 成就   ──→  v0.6 社交
  ↓              ↓              ↓
  数据面板 ──→  成就数据       分享数据
  签到系统    宠物装扮         排行榜
  回归动画    动作库           分享卡
```

## 预计产物

| 版本 | 新增文件 | 估算 gzip 增量 | 估算开发时间 |
|------|----------|----------------|--------------|
| v0.4 | 5 | +15 KB | 中 |
| v0.5 | 8 | +25 KB | 大 |
| v0.6 | 6 | +20 KB | 大 |

## 质量门槛

每个版本都需满足：
- TypeScript: 0 错误
- 单元测试: ≥ 50 个
- 主线流程可走通
- 自动部署 GitHub Pages 通过
- 体积增量 ≤ 30KB gzip

---

**声明**：以上规划根据用户要求"打磨迭代至少三个大版本，做产品经理角度的思考"制定。
每个版本完成后会更新此文件 + CHANGELOG.md。

---

# v11 迭代规划：百科重做 + 多角色 4 轮

> 用户原话：「百科再优化一下 我告诉你不可用你应该想其他方案 而不是弹窗，再整体迭代优化四轮，要从多个角色审视 新增创意点 然后最后看看有没有bug」
>
> 核心问题：v6.1/v8.0 自动调用 Wikipedia/TheMealDB，国内环境超时 4s 后弹"📴 国内环境"toast → 用户体感"做了不靠谱的事还告诉我"
> 4 轮 = 4 个微版本，每轮选 1-2 个核心改动。

## 多角色审视表

| 角色 | 当前痛点 | v11 创意点 |
|------|----------|-----------|
| **PM** | 弹窗让用户感知"产品失败" | v11.0 默认本地；失败转主动 |
| **PM** | 故事页留白多、信息密度低 | v11.1 故事页结构化（背景/冷知识/合成链/关联 4 段）|
| **PM** | 看完故事无反馈 | v11.1 首次阅读 +5🪙 |
| **UI 设计师** | 故事页配色黄 + chip 多 | v11.1 紫青统一 + 取消 chip 洪流 |
| **UI 设计师** | 12 zone 选择器无状态 | v11.1 主题卡显示"已读/未读" |
| **游戏策划** | 故事 = 静态背景，缺玩点 | v11.2 随机故事 / 一次连读 / 跨 zone 推荐 |
| **游戏策划** | 跨区无关联 | v11.2 zone 关联网络（生物↔植物↔元素...）|
| **前端工程师** | API 失败时主线程 await 4s | v11.0 删自动调用，瞬时返回 |
| **前端工程师** | 故事页 11 段 lore 重复渲染 | v11.2 一次连读 1.5s 间隔 |
| **增长 / 留存** | 用户不知道"还能玩什么" | v11.2 故事末尾"→ 推荐下一个 zone" 引导回流 |
| **增长 / 留存** | 无情感锚点 | v11.1 收藏功能 + 已读徽章 |
| **运营** | 不同节日无差异化 | v11.2 节日额外 lore（中秋/圣诞/春节 加 1 段）|
| **QA** | bgm.ts:152 console.warn | v11.3 改 silent |
| **QA** | 收藏页图片懒加载缺失 | v11.3 lazy + 缓存 |

## v11.0 — 百科去弹窗（核心）

**问题根因**：自动调 Wikipedia/TheMealDB → 4s 超时 → fallback → 弹"📴 国内环境"toast

**方案**：失败转主动
- 删 `wiki.ts` 的自动 fetchStory 默认行为
- 改 `getLoreSnippet` 为 `getLocalStory(emoji, zone, level)`：返回本地 4 段（zone.description + zone.flavor + node.lore + 一个"冷知识"pool 随机）
- 12 zone 各加 3 段"冷知识"（zone-level 趣味知识，存到 emoji-trees 或新文件 `zone-trivia.ts`）
- CollectionView 主按钮改名："📖 故事" → 直接展示本地（**不调 API**）
- 末尾加 "🌐 试试在线百科" 次要按钮（小字、低饱和）→ 主动点击才 fetch，失败静默 + 5s 后自动隐藏按钮，**不弹任何 toast**
- 删 "📴 国内环境" toast
- 删 "📴 离线" / "📚 本地" / "📚 Local" / "📖 Wikipedia" / "🍽️ TheMealDB" 5 个 chip → 留 1 个 "📖 故事" 来源徽章（默认 "📚 本地故事"）
- 删 wiki.ts 中 fetchStory 的 Wikipedia/TheMealDB 路径，只留 getLocalStory + 一个可选 `fetchOnline(emoji, name)` 主动调用

**验收**：
- 点 📖 故事 → 0.1s 内出内容（之前 0-4s 不定）
- 国内环境无任何 toast / 弹窗
- 主动点 🌐 试试在线 → 1.5s 后失败时静默，不弹任何东西

## v11.1 — 故事页结构化 + 阅读奖励

**PM/UI/增长** 视角

- 故事卡片 4 段结构：
  1. **📜 背景**（zone.description 改写）
  2. **✨ 冷知识**（v11.0 加的 zone-trivia 池随机 1 段）
  3. **🔗 合成链**（当前 level → 下一级 emoji + name + 4 字提示）
  4. **🌐 关联 zone**（zone-network 推 2 个关联 zone + 一句话关联理由）
- 卡片头部：emoji 大字（5xl）+ zone 名 + tier 徽章 + 解锁状态
- 末尾 "🎁 首次阅读本 zone +5🪙"（localStorage 记录已读 zone 集合）
- 收藏功能：⭐ 收藏按钮 → localStorage 持久化
- 主题卡（CollectionView 顶部 12 个 zone 按钮）显示 "📜 已读" 小角标
- 关弹窗：键盘 ESC 关闭（之前需点关闭按钮）

**验收**：
- 4 段都有内容（不存在"未提供"）
- 首次阅读 12 zone 全部读完 +60🪙
- 已读 zone 主题卡有角标

## v11.2 — 随机故事 + 跨 zone 推荐

**策划/增长** 视角

- 故事页加 3 个新按钮：
  - **🎲 随机故事** → 跳到任意 zone 任意 level 的故事页
  - **📖 一次连读本 zone** → 1.5s 间隔滚动展示 11 段 lore，bg 切换
  - **→ 推荐下一个 zone** → 按 zone-network 推 1 个关联 zone，直接打开
- zone-network：硬编码关联矩阵（creature↔plant, element↔cosmic, music↔culture, mythology↔dream, food↔ocean, architecture↔retro）
- 节日 lore：getSeason() 检测中秋/圣诞/春节/情人节 → 追加 1 段"🌕 节日特辑"
- 主题卡加快捷键：←→ 切换 zone

**验收**：
- 3 个新按钮都有功能
- zone 关联路径 12 个全覆盖
- 节日期间故事页额外 1 段

## v11.3 — bug hunt + 微调

**QA/前端** 视角

- tsc + vitest + build 验证
- 修 console.warn：
  - `bgm.ts:152` 改 silent（用 `try { } catch (_) {}`）
- 检查 favicon.svg / index.html title
- 故事页图片懒加载（虽然 v11.0 删了图片路径，但要保留 type 字段兼容）
- 修潜在 UI 边界：
  - 故事页 max-height 滚动
  - 主题卡 12 个在小屏（<360px）是否换行
- 加一项：emoji-trees lore 字段缺失时不再 fallback "成员：xxx"（v11.0 已保证 132 段都有）
- BUG_AUDIT.md 补 v11 记录
- VERSION_COMPARISON_V101112.md（继续 v789 之后）

## 文件改动清单

| 文件 | 改动 | 估算 |
|------|------|------|
| `src/lib/wiki.ts` | 删自动 fetch，保留主动 fetchOnline + getLocalStory | -50 行 |
| `src/data/zone-trivia.ts` | 新建：12 zone × 3 段冷知识 = 36 段 | +60 行 |
| `src/data/zone-network.ts` | 新建：zone 关联矩阵 + 关联理由 | +30 行 |
| `src/components/collection/CollectionView.tsx` | 故事卡片 4 段 + 已读 + 收藏 + 3 个新按钮 | 重构 200 行 |
| `src/lib/zone-story.ts` | 新建：getLocalStory(emoji, zone, level, readZones) 整合 | +40 行 |
| `src/store/uiStore.ts` | 加 readZones Set + favoriteZones Set + addRead/addFavorite | +20 行 |
| `src/lib/bgm.ts` | console.warn 改 silent | -1 行 |
| `BUG_AUDIT.md` | v11 4 轮记录 | +30 行 |
| `PLANNING.md` | 已 append（本文档）| - |

## 质量门槛

- TypeScript 0 错误
- 37+ 测试通过
- build 增量 ≤ +10 KB gzip
- GitHub Pages 自动部署通过
- 多角色审视：4 轮中每轮至少覆盖 3 个角色视角

---

# v12 迭代规划：起点光球删除 + 顶部 0 堆叠 + 多角色 4 轮

> 用户原话：「动画光球不要，然后再整体优化下，最上方 emoji 还是堆叠着。再多角度迭代四轮」
>
> 2 个硬性反馈：
> 1. **v10.0 起点光球**（紫青弱光球 scale 0.6）仍嫌"突兀" — 2 轮反馈了，要彻底删
> 2. **v9.1 顶部 5 chip 一行**（🪙 👑 🎁 🔄 📊）视觉上仍堆叠 — 2 轮反馈了，要彻底解决

## 多角色审视表

| 角色 | 当前痛点 | v12 创意点 |
|------|----------|-----------|
| **PM** | "光球不要"+"顶部堆叠" 2 轮没解决 | v12.0 删光球 + v12.1 顶部 1 行 ≤ 2 chip + 抽屉收纳 |
| **PM** | 4+4+5+11+7+6+1=38 个 UI 入口堆在屏幕 | 抽屉集中收纳 6+ 个次要入口，主页只留主玩法 |
| **UI 设计师** | 5 chip 一行 ≈ 80px 高信息密度 → 视觉拥挤 | 顶部 28px：1 货币 + 1 设置按钮 |
| **UI 设计师** | 起点光球突兀，破坏"流光带主导"的视觉韵律 | 删光球 + 加小三角箭头指示方向（紫青）|
| **策划** | tab 切换无快捷键 | v12.2 1/2/3/4 切 tab |
| **策划** | 11/11 满图鉴无感 | v12.3 全屏紫青烟花 |
| **前端** | localStorage 体积膨胀（readZones + favoriteZones + 7 日挑战 + 签到 + 收藏 + 已读）| v12.3 base64 + JSON 压缩 |
| **前端** | 抽屉组件 React 18 双 mount 风险 | v12.3 检查 + 修 |
| **增长** | 抽屉收纳后"签到"难发现 | 抽屉顶部固定"🎁 签到"红色角标 |
| **增长** | "🎲 来一抽" 入口缺失 | 抽屉内"🎲 立即扭蛋"按钮 |
| **运营** | 节日 / 周末无活动横幅 | 抽屉顶部"今日活动"slot |
| **QA** | 抽屉背景滚动穿透 | 锁 body scroll |
| **QA** | 抽屉开关重复 +5🪙（如果 drawer 内有奖励）| 严格只在显式 onClick 触发 |

## v12.0 — 起点光球彻底删除

**问题根因**：v6.0 紫青大光球 → v10.0 紫青弱光球 scale 0.6 → 用户 2 轮反馈"光球不要"
**结论**：用户对"光球"本身的排斥是底层偏好（可能是"光球在闪眼睛"或"破坏 2048 简洁性"）

**方案**：
- 删 `MergeGrid.tsx` line 122-138（光球 DOM 创建 + GSAP）
- 删 `effects.ts` `startBallInner` / `startBallShadow` 出口（其他位置未使用）
- 保留并加强：流光带 2px（增加方向箭头）/ 涟漪环 / 合并浮起 / 紫青描边 / 棋子拖影 / 落位回弹
- 新增"小三角箭头"（紫青 8px 宽）在流光带起点位置代替光球，0.3s 渐显 + 0.2s 渐隐

**验收**：MergeGrid 移动动画的 DOM 操作不再创建 `.radial-gradient` 圆形元素；只保留 2px 细线 + 8px 三角

## v12.1 — 顶部 0 堆叠 + 抽屉收纳

**PM/UI/增长** 视角

**HomeTab 顶部改造**：
- 当前 5 chip 一行 → 改为 2 chip 一行
- 新结构：`[🪙 N 货币]` + `[⚙️ 设置]`
- "👑 最高 Lv.X" 移到 zone 卡片内右上角
- "🎁 签到" 移到抽屉内（带红色角标）
- "🔄 刷新" 移到抽屉内
- "📊 统计" 移到抽屉内
- "🗺️ 主题馆" 移到抽屉内

**SettingsDrawer 新组件**：
- 右侧滑入，w-72 (288px)，紫青边框
- 触发：[⚙️] 按钮 / 屏幕右滑 24px（边缘手势）/ ESC / 点击抽屉外
- 抽屉内：
  ```
  ┌─ ⚙️ 设置 ─────────────┐
  │ 🎁 每日签到  [未完成红点]│
  │ 👑 最高等级    Lv.X    │
  │ 🗺️ 主题馆              │
  │ 📊 统计                │
  │ 🔄 刷新网格  -5🪙      │
  │ 🎲 立即扭蛋            │
  │ 🔇 静音开关            │
  │ 💡 v12.0 删了光球...   │
  └────────────────────────┘
  ```
- 锁 body scroll（drawer 开时 overflow-hidden）
- 紫青渐变背景 + 紫青 0.4s 滑入动画

**验收**：
- 顶部 1 行 28px 高，1 货币 + 1 设置
- 抽屉 6+ 入口齐全
- ESC/点遮罩/右滑 全部能关
- 滑动动画 60fps

## v12.2 — 快捷键 + 挑战气泡

**策划/前端** 视角

- 1/2/3/4 数字键切 tab（home / zone / pet / stats）
- 主页 zone 卡片加"📈 N/11" 数字 + 小进度环
- 顶部抽屉入口加"🎯 挑战 N/M"气泡（任务完成度 < 100% 时显示）
- 主页增加"⚡ 1键合成" 快速入口（按住空格/连点 3 次触发自动合并）

## v12.3 — bug hunt + 性能优化

**QA/前端** 视角

- 修：抽屉 React 18 严格模式双 mount → 抽屉打开 + 关闭不触发任何奖励（已安全）
- 性能：localStorage base64 + JSON 压缩（readSave 减少 ~30%）
- 性能：MergeGrid useMemo deps 优化（避免每次 render 重算）
- 加：成就 11/11 满图鉴 → 全屏紫青烟花 1.5s
- 加：bgm 错误时弹"🔇 静音" 开关（v11.3 silent 后用户不知音频是否开启）
- console.error / warn / log 全部静默
- BUG_AUDIT.md 补 v12 记录

## 文件改动清单

| 文件 | 改动 |
|------|------|
| `src/components/grid/MergeGrid.tsx` | 删 20 行起点光球 + 加 8px 三角箭头 + useMemo |
| `src/lib/effects.ts` | 删 startBallInner/Shadows 出口（保留 import 不影响 tree-shake） |
| `src/components/ui/SettingsDrawer.tsx` | 新建：抽屉 280 行 |
| `src/components/tabs/HomeTab.tsx` | 顶部 1 行改 2 chip + 挂载 SettingsDrawer |
| `src/lib/persistence.ts` | base64 + JSON 压缩 |
| `src/store/uiStore.ts` | 加 settingsDrawerOpen 状态 + setter |
| `src/components/collection/CollectionView.tsx` | 11/11 满图鉴 → 全屏烟花 |
| `BUG_AUDIT.md` | v12 4 轮记录 |
| `PLANNING.md` | 已 append（本文档）|

## 质量门槛

- TypeScript 0 错误
- 37+ 测试通过
- build 增量 ≤ +10 KB gzip
- GitHub Pages 自动部署通过
- 多角色审视：4 轮中每轮覆盖 5+ 角色

---

# v13 迭代规划：重开一局按钮 + 多角色 4 轮

> 用户原话：「继续检查打磨」「重置按钮记得直接是重开一局，继续迭代」
>
> 核心问题：
> 1. 抽屉里"🔄 刷新网格 -5🪙"是"局部重置"（保留 Lv.4+），玩家可能误以为是"重开一局"
> 2. `gameStore.reset: () => set(init())` 存在但**没清 uiStore / 没清 modal / 没清 toast**
> 3. 玩家没看到"重开一局"按钮 — 缺一个明显的"从头开始"入口
>
> 4 轮 = 4 个微版本，每轮 1-2 个核心改动。

## 多角色审视表

| 角色 | 当前痛点 | v13 创意点 |
|------|----------|-----------|
| **PM** | 没"重开一局"按钮，玩家卡死只能 F5 刷新 | v13.0 抽屉底部加红色 "🔁 重开一局" 按钮 |
| **PM** | reset 没二次确认，玩家可能误触 | v13.0 紫红渐变 modal，4 行说明 + 2 按钮 |
| **UI 设计师** | "🔄 刷新" vs "🔁 重开" 同义难辨 | v13.0 紫色 chip vs 红色 button，emoji + 颜色双重区分 |
| **UI 设计师** | 二次确认 modal 视觉轻 | v13.0 紫红渐变 + ⚠️ 大字 + 4 行进度说明 |
| **策划** | 重开没奖励，玩家没有动力 | v13.1 重开送 🎁 50🪙 + 首扭蛋 ×1.5（3 局）|
| **策划** | 重开防误触不够 | v13.1 "确认" 按钮长按 1s 才生效 |
| **策划** | 多次重开没成就 | v13.2 累计重开 1/3/5/10 → 解锁 "🔁 破而后立" |
| **前端** | `reset: () => set(init())` 不完整 | v13.0 全栈重置：grid/collection/coins/pet/checkin/challenges |
| **前端** | reset 后 modal 不关 / toast 残留 | v13.3 清 uiStore 弹层状态 + 清 toast queue |
| **前端** | reset 后宠物 egg 计时不对 | v13.3 petEggStartedAt 同步重置为 now |
| **增长** | uiStore.readZones/favoriteZones 跟着重置 = 玩家情感清零 | v13.0 保留收藏/已读（情感锚点） |
| **增长** | 重开体验断裂 | v13.0 全屏紫青 1.5s 粒子过场 + 大字 "🔁 重开一局！" |
| **运营** | "重开" 一词冰冷 | v13.0 改 "🔁 重新开始"（更友好） |
| **运营** | 玩家重开前不知道会失去什么 | v13.0 modal 4 行进度说明（"X 局 / Y 羁绊 / Z 收藏保留"）|
| **QA** | reset 二次确认 ESC 关闭 | v13.3 加 ESC 关闭 + Enter 确认 |
| **QA** | React 18 双 mount modal 双弹 | v13.3 modal 严格 useState 控制 + 单次 mount |

## v13.0 — "🔁 重开一局"按钮 + 二次确认 modal

**问题根因**：
- `gameStore.reset: () => set(init())` 存在但只重置 gameStore
- uiStore 的 modal flags（settingsOpen / readZones / favoriteZones / 已读标志）不重置 → 残留状态
- 没清 `localStorage`（虽然 `set(init())` 后 save() 会写新值，但 cache 一致性差）
- 玩家没看到"重开一局"按钮

**方案**：
1. `gameStore.ts` 增强 reset：
   ```ts
   reset: () => {
     const s = get()
     set(init())
     get().trySpawnOne()  // 确保 grid 至少 1 颗
     save()  // 立即持久化（防止下次刷新又读旧值）
   }
   ```
2. `uiStore.ts` 加 `resetUi()`：清 settingsOpen / 一堆 modal flag / 清 toast queue
   - **保留** readZones / favoriteZones / muted（情感锚点）
3. `SettingsDrawer.tsx` 加 "🔁 重开一局" 红色按钮（抽屉底部，1px 分割线区隔）
4. 新建 `ResetConfirmModal.tsx`：
   - 紫红渐变背景，⚠️ 大字
   - 4 行说明：📊 进度清零 / 🐾 宠物清零 / 📅 签到清零 / ⚠️ 收藏和已读保留
   - 2 按钮：[取消] [🔁 确认重开]
   - 触发：抽屉按钮
5. 抽屉内"立即重开"：调 reset + resetUi + 紫青全屏粒子 1.5s + 大字"🔁 重开一局！"

**验收**：
- 抽屉点"🔁 重开一局" → modal 弹出
- modal [取消] 关闭，状态不变
- modal [🔁 确认重开] → 重置 + 紫青粒子 + 跳 home
- 重开后收藏/已读不丢，coins=初值，grid=0+1（trySpawnOne）

## v13.1 — 长按 1s 确认 + 重开奖励

**策划** 视角

- 二次确认 modal "确认重开" 按钮加 **长按 1s 才生效**（防误触）
- 进度条显示（0-100% 1s）
- 松手未满 1s 取消
- 重开后立即送 🎁 50🪙 重开奖励（pushToast + addCoins）
- 首扭蛋 1.5 倍 buff 持续 3 局（用 `useGameStore.buffMultiplier = 1.5` 临时态，3 局后回 1.0）

**验收**：
- 长按 1s 才确认，短按取消
- 重开看到 "🎁 重开奖励 +50🪙" toast
- 3 局内扭蛋 coin 实际 1.5 倍

## v13.2 — 重开成就 + 紫青过场

**策划/增长** 视角

- 加成就：累计重开 1 / 3 / 5 / 10 次 → 解锁 "🔁 破而后立" 等 4 个成就
- 重开后跳到 home tab 但**保持 1.5s 紫青全屏粒子过场**（不要立刻可见 grid）
- 过场：30 颗紫青粒子 + 中心"🔁 重新开始" 大字 1.2s → 渐隐 → 网格淡入
- uiStore.resetCount 持久化（独立 KEY `gashapon-reset-count`）

**验收**：
- 重开 1/3/5/10 → toast 通知成就
- 1.5s 紫青过场可见
- uiStore.resetCount 持久化

## v13.3 — bug hunt + 微调

**QA/前端** 视角

- 修：reset 后所有 modal 关闭（可能 uiStore 漏关 `checkinOpen` / `statsOpen` / `zoneGalleryOpen`）
- 修：toast 队列清空
- 修：宠物 pet state 重置（pet 可能仍在宠物页）
- 加：ESC 关闭二次确认 modal
- 加：Enter 确认（modal 内）
- 性能：reset 后立即 useMemo deps 优化
- 性能：localStorage 体积（不重置的部分会持续增长）— 暂不动，v14 再 base64
- BUG_AUDIT.md 补 v13 记录
- console.error / warn 检查

## 文件改动清单

| 文件 | 改动 |
|------|------|
| `src/store/gameStore.ts` | 增强 reset（清状态 + save + spawn 1）|
| `src/store/uiStore.ts` | 加 resetUi() + resetCount |
| `src/components/ui/ResetConfirmModal.tsx` | 新建：紫红渐变 modal + 长按 1s 按钮 |
| `src/components/ui/SettingsDrawer.tsx` | 加 "🔁 重开一局" 红色按钮 + 挂载 modal |
| `src/lib/achievements.ts` | 加 "🔁 破而后立" 4 档 |
| `src/components/ui/ResetBurst.tsx` | 新建：1.5s 紫青全屏粒子过场 |
| `src/App.tsx` | 挂载 ResetBurst |
| `BUG_AUDIT.md` | v13 4 轮记录 |
| `PLANNING.md` | 已 append |

## 质量门槛

- TypeScript 0 错误
- 37+ 测试通过
- build 增量 ≤ +12 KB gzip
- GitHub Pages 自动部署通过
- 多角色审视：4 轮覆盖 PM/UI/策划/前端/增长/运营/QA = 7 角色



