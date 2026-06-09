# Changelog

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
