# Changelog

## v0.9.0 (2026-06-09) — 羁绊与世界版本

### 新增
- **6 对主题羁绊**（`src/lib/synergies.ts` + `SynergiesPanel.tsx`）
  - 万物有灵（生物圈+植物界）/ 魔力回路（元素殿+神话殿）/ 人间烟火（美食街+人文阁）
  - 星际交响（星际航+音符符）/ 城市蓝图（建筑谱+复古厅）/ 梦境潜游（梦境海+深蓝海）
  - 双方区域都 Lv.10+ → 解锁被动 buff（+10% 收益 / +2% 暴击 / +5% 幸运）
- **世界进度环**（`WorldRing.tsx`）
  - 12 主题按段绘 SVG 环
  - 凑齐整圈（12 区都 Lv.11）→ 解锁「传说蛋」彩蛋
- **视觉打磨工具**（`src/lib/visual-tune.ts`）
  - EASE 缓动统一（pop/slide/bounce/smooth/elastic）
  - `burstParticles(x, y, count, color)` 通用粒子喷射
  - `floatText(x, y, text, color)` 通用浮动文字
- **更多 Tab 加「主题羁绊」入口**

### 验证
- TypeScript: 0 错误
- Vitest: 37/37 通过
- Vite build: 118.34 KB gzip（99 modules）

---

## v0.8.0 (2026-06-09) — 操作与惊喜版本

### 新增
- **方向键 Dpad**（`src/components/grid/Dpad.tsx`）
  - 网格下方 4 个固定方向按钮 ↑↓←→
  - 移动端单手可玩，保留滑动手势
- **消消乐 3 连锁动**（`detectMatch3` + `match3-pulse` CSS）
  - 3 个同色同级排成行/列 → 整条线粉红脉冲
  - 一键合并按钮显示「3连×N」预提示
- **4 款限定蛋壳**（`src/lib/special-eggs.ts`）
  - 💎 钻石蛋（4 段） / ⭐ 星辰蛋 / 🌸 樱花蛋 / 🌑 暗夜蛋（5 段）
  - 5% 概率抽取，出蛋后 bonus 15-50 币
  - 蛋壳渐变色 + 光晕动画
- **神赐事件**：8% 概率直接给 Lv.6 棋子入网
- **gacha_frenzy 事件期间免单**

### 验证
- TypeScript: 0 错误
- Vitest: 37/37 通过
- Vite build: 116.52 KB gzip（96 modules）

---

## v0.7.0 (2026-06-09) — 爽感与事件版本

### 新增
- **宠物早产**（`gameStore.ts`）
  - Lv.10 → 蛋：改为 Lv.4 → 蛋
  - Lv.11 → 孵化：改为 Lv.5 → 孵化
  - 玩家 2 分钟内必拿宠物
- **一键合并**（`src/lib/auto-merge.ts` + `AutoMergeButton.tsx`）
  - 贪心反复找最优方向滑动，最多 6 轮
  - 一次合成多事件 → 一次暴击计算
- **8 种随机事件**（`src/lib/events.ts` + `RandomEventModal.tsx`）
  - 宠物撒娇 / 元素共鸣 / 时间倒流 / 双倍时段 / 连击风暴 / 扭蛋狂欢 / 守护之盾 / 神秘访客
  - 全屏事件卡片 + 倒计时进度条
  - 持续类 buff 写入 `activeEventBuff`（右上角 EventBuffBadge 显示）
- **Gashapon 集成 gacha_frenzy 免单**

### 验证
- TypeScript: 0 错误
- Vitest: 37/37 通过
- Vite build: 115.41 KB gzip（94 modules）

---

## v0.6.0 (2026-06-09) — 社交与分享版本

### 新增
- **分享卡片生成**（`src/lib/share-card.ts` + `SharePanel.tsx`）
  - Canvas 540×960 PNG（9:16 竖版社媒友好）
  - 包含：用户 emoji + 等级 + 主题 + 宠物 + 合成次数 + 最佳连击 + 主题水印
  - 按钮：📥 下载 PNG / 📋 复制分享文案
  - 入口：更多 Tab → "分享我的合成" + 图鉴 Lv.10+ emoji 弹层 → "🖼️ 分享这张"
- **本地排行榜**（`src/lib/leaderboard.ts` + `LeaderboardPanel.tsx`）
  - 3 个榜单：🔥 最高连击 / ⭐ 最高等级 / 🏆 通关主题
  - localStorage 存多玩家（`emoji2048_leaderboard_v1`）
  - 名字可自定义或留空随机
  - 序号彩牌（🥇 金 / 🥈 银 / 🥉 铜）
- **周末双倍活动**（`src/lib/weekend.ts`）
  - 周六/周日全事件 coin ×2
  - 主页 buff 条加 "🎉 周末双倍" 动画标识
  - 提醒玩家周末来玩
- **图鉴展示墙**（`CollectionView.tsx` 改造）
  - 12 主题选择 + 树视图（grid-cols-6 替代 11 列）
  - 点击已解锁 emoji 弹层 `NodePreview`（大图 + 故事）
  - Lv.10+ 节点解锁"🖼️ 分享这张"按钮
- **CI 修复**：补 `@types/node`（vite.config.ts 的 `node:path`/`__dirname`）

### 验证
- TypeScript: 0 错误
- Vitest: 37 测试通过
- Vite build: 113.02 KB gzip（89 modules）
- GitHub Pages: 自动部署成功

---

## v0.5.0 (2026-06-09) — 成就与深度版本

### 新增
- **40+ 成就系统**（`src/lib/achievements.ts` + `AchievementsPanel.tsx`）
  - 6 类分组：merge(8) / collect(8) / gacha(5) / pet(8) / combo(5) / awaken(5)
  - 进度条 + 解锁提示
  - 稀有 / 史诗 / 神话 / 传说 四档品质
- **7 套宠物装扮**（`src/lib/outfits.ts` + `OutfitsPanel.tsx`）
  - 👑 王冠 / ☀️ 太阳冠（限定 - 通关全部 12 区解锁）/ 🌸 樱花 / 🎉 派对 / 🧙 法师 / 🌵 仙人掌 / 🌈 彩虹
  - 装扮应用到 Pet 组件显示
- **3 首 BGM**（`src/lib/bgm.ts`，BgmPlayer 类）
  - 日常 casual / 战斗 battle / 觉醒 awaken
  - Web Audio API 合成旋律 + 鼓点
  - 切换场景自动切歌
- **设置面板**（`SettingsPanel.tsx`）
  - 音乐 / 音效 / 震动 / 重置进度
  - 持久化偏好

### 验证
- TypeScript: 0 错误
- Vitest: 37 测试通过
- Vite build: 109.78 KB gzip（84 modules）

---

## v0.4.0 (2026-06-09) — 留存与日活版本

### 新增
- **7 日签到**（`src/lib/checkin.ts` + `CheckinPanel.tsx`）
  - 7 日连击奖励（10/30/50+1扭/80/100+1神/150/200+太阳冠）
  - 主页 🎁 按钮带"待签"红点
  - 连续中断 → 重新开始
- **回归奖励**（`ComebackModal.tsx` + `calcComebackReward()`）
  - 24h+ 未见 → 欢迎弹窗
  - 按天数分级：1-2 天小礼 / 3-6 选中礼 / 7+ 大礼
- **7 日挑战**（`Challenge` 接口 + `generateChallenges()`）
  - 池：合成 20/达 Lv.8/解锁 2 区/连击 ×10/扭蛋 10/喂食 3/抚摸 5/觉醒 1/集齐 1 区 11 等级/完成 3 任务
  - 进度条 + 完成后奖励领取
- **数据面板**（`StatsPanel.tsx` + `history` 字段）
  - 累计扭蛋/总合成/总消耗/总收益/最佳连击/历史
  - 7 日活跃度 SVG 折线图

### 验证
- TypeScript: 0 错误
- Vitest: 37 测试通过
- Vite build: 104.97 KB gzip

---

## v0.3.0 (2026-06-09) — PM 终极优化

### 新增
- **12 大生态区**（v0.1 4 区 → v0.2 8 区 → v0.3 **12 区**）
  - 神话殿（⚔️ 红粉系）· 梦境海（💭 紫系）· 复古厅（🕹️ 黄系）· 深蓝海（🌊 青系）
  - 每区 11 级链 + 觉醒形态
  - 12 主题 emoji 树共 132 个等级节点
- **季节活动系统**（`src/lib/season.ts`）
  - 每日根据日期哈希生成"季节"（春/夏/秋/冬）
  - 每日生成一个"幸运区"
  - 当前区匹配季节 → 奖励 ×2
  - 当前区是幸运区 → 奖励 ×1.5
  - 主页面顶部条展示 buff 倍率
- **5% 暴击**（`merge_crit` 事件）
  - 触发时所有奖励 ×5
  - 红色 + 屏幕震动 intensity=3
- **宠物进化系统**（v0.3 重写 `src/lib/pet-gen.ts`）
  - 4 形态阶段：🥚 蛋 → 物种幼崽（Lv.2）→ 物种成体（Lv.5）→ 物种觉醒（Lv.8+）
  - 进化奖励：幼崽 +50、成体 +200、觉醒 +1000、+5000（Lv.10）
  - `formChanged` 触发屏幕彩纸 + 音效 + 大飘字
  - 喂食冷却 30s，抚摸冷却 5s
- **主线任务**（`MAIN_TASKS` 12 章节）
  - 通关 1 区 → 解锁 1 新区
  - 终章 12: "合众之神" 需全部主题觉醒 1 阶，奖励 20000 币
  - 准备好状态推进逻辑
- **21 种事件奖励**扩展到 24 种
  - 新增 `merge_crit` / `merge_lucky` / `merge_season` / `pet_evolve` / `task_main`

### 优化
- 暴击/幸运时 CoinBurst 用专属 emoji（💥/🍀）+ 颜色（红/绿）
- 主页 buff 条：实时显示当前倍率（×1.5 / ×2 / ×3）
- `MergeGrid` 支持 finalReward/isCrit/isLucky 字段
- `gameStore.slide()` 统一应用 buff 系数

### 验证
- TypeScript: 0 错误
- Vitest: 37 测试通过
- Vite build: 100.72 KB gzip（74 modules）

---

## v0.2.0 (2026-06-09) — 爽感强化

### 新增
- **8 大生态区**（v0.1 4 区 → v0.2 **8 区**）
  - 美食街 / 星际航 / 音符符 / 建筑谱
  - 每区 11 级链 + 觉醒形态
- **觉醒循环**（无限模式）
  - Lv.12+ 进入"觉醒·Ⅰ阶/Ⅱ阶/...·X阶"
  - 罗马数字显示 Ⅰ~Ⅻ，超出后用阿拉伯数字
  - 觉醒专属光晕 + 脉冲动效 + 升级射线
- **滑动合并引擎**（`slide()` 函数）
  - 整行/列推动 → 自动合并
  - 触屏滑动 + 键盘方向键（↑↓←→/WASD）
  - 滑动后回弹 + 滑入动效
  - 支持觉醒循环
- **事件奖励体系**（`src/lib/event-rewards.ts`）
  - 21 种 EventKind（基础/连击/首次/稀有/史诗/神话/觉醒·三档）
  - 慷慨奖励：基础 +1、连击 +5、首次 +10、稀有 +30、史诗 +80、神话 +200、觉醒 +500/2000/10000
  - 系数叠加：combo × level × affection
- **CoinBurst**（`src/components/ui/CoinBurst.tsx`）
  - 强度 0-3 决定粒子数（5/10/20/32）
  - 粒子飞向左上角货币栏
  - intensity≥2 触发屏幕震动
  - 主文字爆涨 + 数字滚动
- **ComboMeter**（`src/components/ui/ComboMeter.tsx`）
  - 屏幕光带（box-shadow inset）颜色跟 zone
  - 3 档 tier：连击/超级/神级
  - combo≥3 触发 pulse 抖屏
- **CoinDisplay**（`src/components/ui/CoinDisplay.tsx`）
  - 数字变化时 `coin-bump` 缩放 + 亮度提升
- **ZoneGallery 主题弹层**（`src/components/collection/ZoneGallery.tsx`）
  - 主页去掉 8 按钮横排，改为"当前主题卡片 + 🗺️ 切换入口"
  - 弹层 8 主题 2 列网格
  - 三态：🔒 未解锁 / 🧭 探索中 / ✅ 已通关
  - 主题卡片显示：图标 + 名称 + 副标题 + 收集进度条
  - 提示面板：觉醒循环、宠物进化等说明
- **7 个新 keyframes**：`particleBurst` / `burstMain` / `comboPulse` / `levelRay` / `coinBump` / `awakenFlash` / `tileSlideIn`

### 修改
- `MergeGrid` 改为方向滑动（替代 v0.1 拖拽）
- `HomeTab` 不再堆 8 个主题按钮
- `App.tsx` 挂载全局 `CoinBurstLayer` + `ComboMeter` + `ZoneGallery`
- `gameStore` 走 `event-rewards` 计算奖励（不再写死 1 币）
- 标题改为"合成生态 v0.2"

### 验证
- TypeScript: 0 错误
- Vitest: 37 测试通过
- Vite build: 97.94 KB gzip（73 modules）

---

## v0.1.0 (2026-06-09)

### 核心功能
- 扭蛋机：3D 立体感 + GSAP 摇杆/摇晃/出蛋动画
- 2048 合成：4×4 网格 + 拖拽 + 自动合并 + 触屏
- 4 大生态区：生物圈/植物界/元素殿/人文阁（11 级链）
- 宠物系统：12 物种 × 5 体型 × 5 性格，跟随鼠标/手指轨迹
- 图鉴：4 主题进度可视化
- 每日任务：3 任务/天
- 货币经济：合成 +1 / 扭蛋 -1 / 喂食 -2
- 9 个国内 API 接入 + 降级 + 缓存
- 7 类 Web Audio 音效（无音频文件）
- localStorage 自动存档
- 移动端响应式 + 安全区域

### 教程
- 4 步新手引导：扭蛋 → 合成 → 宠物 → 喂食

### 测试
- 33 单元测试用例
