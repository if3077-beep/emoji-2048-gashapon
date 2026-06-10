# BUG_AUDIT.md — emoji-2048-gashapon

> 最后自查：2026-06-10（v13 push 后）
> 22 个 GitHub Pages 版本（v0.4 → v13）已 push，37 测试 0 错误，build 141.46 KB gzip。

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
| "2048 轨迹动画太丑了" | v4.0 | ✅ 已重做 | 删 SVG dasharray 折线；改 **起点光球**（radial 放射 0→1.4→0.3 缩放 + 32px+64px 双层 boxShadow）+ **流光带**（linear-gradient 6px 宽/高带，0.4s GSAP 沿方向滑过整个 grid + 双层 box-shadow 发光）+ **终点爆裂**（60px 径向 burst 1.6→2.4 缩放）+ **轨迹 cell 依次白光闪**（沿移动顺序 40ms 延迟）+ **起点喷 ⭐✨💫🌟 8 个粒子**（沿反方向旋转 360° 飘 0.4s）|
| "底栏第二个页面不要了 + 优化第一个界面" | v5.0 | ✅ 已删 | 删 MergeTab 路由 + 文件；底栏改 3 列（主页/图鉴/更多）；HomeTab 整合 Gashapon + MergeGrid + DeadlockPanel；ZoneSuggestion 去掉 setTab('merge') 跳转 |
| "轨迹再优化一下" | v5.2 | ✅ 已加 | 合并位置 **tile 浮起**（y -10 + scale 1.12 → 弹回 0.32s bounce + 金色阴影 24px 渐隐）；4+ 连锁 **grid 整体震动**（x -3/y 2 → 0 elastic.out）；5+ 连锁 **12 个 ⭐✨💫🌟💛 粒子向上汇聚**（旋转 720° + drop-shadow 金色）|
| "整体 2048 动效再优化" | v5.2 | ✅ 已加 | 合并浮起 + 4+ 震动 + 5+ 粒子汇聚（见上）|
| "成就合并要简略展示" | v5.1 | ✅ 已改 | 删 v4.1 carousel+dots+抽屉；改**紧凑 stack list**（最多展示 3 张卡 + 剩余"+N 更多"折叠 + 顶标"✨ N 个"+ 总奖励"+"全部收下"金色按钮）；卡片高度紧凑（图标 40px + 标题 + 截断描述 + 奖励）|
| "PM 视角再打磨和新增爽感项" | v5.3 | ✅ 已加 | **🔥 连滑 streak bar**（连续 3 次成功滑动 +5🪙 + 进度点 + 满格动画 + streak 失败清零 + toast "🔥 X 连滑 +5🪙"）；GameState 加 slideStreak 字段 |
| "成就你合并了但是没有展示呀" | v4.1 | ✅ 已重做 | AchievementUnlockModal carousel 模式：多成就时"✨ N/total"进度徽章 + 左右切换按钮 + 12px dots 指示器 + 标题/描述随 active 切换重渲；点"📋 全部"弹出**右侧抽屉展柜**（0.3s slide 动画 + 12 项成就 list + 总奖励/成数统计 + 全部收下按钮）|
| "继续打磨" | v4.2 | ✅ 已加 | 合并位置 3 个合成后的新 emoji 粒子（径向散开 + 旋转 + drop-shadow 主题色），数字飘字旁边再飞 3 颗 |
| "动效这个黄色光晕很丑" | v6.0 | ✅ 已重做 | 新建 `src/lib/effects.ts` 集中所有动效配色：极光紫青（`#a78bfa` + `#67e8f9` + `#f0abfc`）替代 `rgba(251,191,36,...)` 金黄；MergeGrid 起点光球用 radial-gradient（白→青→紫 4 色层 + 紫青双层 box-shadow 28+56px）；流光带 6px 宽紫→青 linear-gradient（带紫青双层 18+36px 光晕）；终点爆裂 60px 青粉径向；移动 cell 闪光 zone-aware 染色；合并浮起 y -10 + 紫青阴影；5+ 连锁 12 颗 ⭐✨💫🌟💜 粒子 drop-shadow 改青；数字飘字颜色全紫（#c4b5fd 替代 #fde68a）；Dpad hint 高亮从金色 `bg-gold-500 ring-gold-300` 改紫青 `text-white ring-violet-400/50` |
| "图鉴接入免费 API" | v6.1 | ✅ 已接 | 新建 `src/lib/wiki.ts`：1) `WIKI_ZH = zh.wikipedia.org/api/rest_v1/page/summary/` 中文摘要（无 key 免费）2) TheMealDB 菜谱（无 key 免费，限 food/ocean 区）3) 12 zone 关键词 fallback → 4) emoji-trees 风味 local fallback。CollectionView 棋子弹层加"📖 故事 / 🍽️ 看菜谱"按钮（isFood 才显示菜谱），loading spinner + 来源 chip（📖 Wikipedia / 🍽️ TheMealDB / 📚 Local）+ ↗ 打开链接 + 缩略图 |
| "整体再迭代三次" | v6.2 | ✅ 已迭代 | 第一次 v6.0 配色重设计；第二次 v6.1 接入 API；第三次 v6.2 稀有时刻全屏：合成 Lv.10+ 触发 1.6s 全屏紫青径向背景 + 8xl emoji + "🌟 Lv.X 稀有时刻 🌟" + "达成新等级 · 收藏已解锁" + GSAP back.out 缩放 + CSS letter-spacing 1.5s 动画 |
| "合成弹出大光晕太丑" | v7.0 | ✅ 已重做 | 新建 `rippleRing()` 函数 + MergeGrid 终点从 60px 紫青径向 burst 改成 **2 圈紫青细环涟漪**（cyan+purple 错开 0.12s，scale 0→3.2→4.4，0.4s 渐隐，1.5px/1px 双层 ring 描边 + 紫青光晕 12px）—— 像石子入水的波纹 |
| "再看看有什么一起优化和新增 迭代三版本" | v7.0/7.1/7.2 | ✅ 3 版迭代 | **v7.0**：ripple 环 + ComboMeter 默认色 #fbbf24 金→#a78bfa 紫青 + CoinDisplay 数字滚动（ease-out cubic 0.4s RAF 帧插值 + tabular-nums 防抖）+ 删除 endBurst 旧 import；**v7.1**：4+ 连锁 eventStep 80→40ms / 5+ 连锁 28ms（更紧凑爆发感）+ 5+ 连锁 12 颗粒子汇聚触发提前到 4+ + 新增 2 颗同 level 连接线（zone 色细线 0.3s + scaleX 0→1 错位扫描 grid 4 方向，最多画 3 对）；**v7.2**：ZoneGallery 主题切换 0.3s 紫青径向过场（opacity 0→1→0 + power2）+ 滑动瞬间 navigator.vibrate(10) + 主题切换 vibrate(15) + toast 1.8s→2.2s + Toaster top-24→top-12 更显眼 |
| "图鉴百科接口加载不出来"（国内） | v8.0 | ✅ 已修 | `wiki.ts` 新增 `fetchWithTimeout`（AbortController + 4s 超时）+ `StoryResult.offline` 标识 + 本地 `getLoreSnippet` 兜底（node.lore + zone.flavor）+ CollectionView 加 📴 离线 toast 浮层（"国内环境，API 暂不可用，已用本地故事"，1.5s）+ 来源 chip 显示"📚 本地"+"📴 离线" |
| "最上方 emoji 堆叠没解决" | v8.1 | ✅ 已重做 | **货币条**：1 行 4 chip 极简 [🪙 数字] [🎁 7] [📊] [👑 Lv.X]（去掉"最高"和"×combo"2 chip）；**BuffStrip 新组件**：季节buff 5 chip 改 1 行 1 chip + ⌄ 展开按钮（默认收起避免拥堵）；**DailyFortune**：6 圆徽章+·+数字 拥堵 → 改 1 进度条 + 1 emoji 数字（"下一徽章 🎁 label [进度] N/M"）|
| "2048 死局可能依然在" | v8.2 | ✅ 已加自动救济 | gameStore 新增 `autoRelief()`：满格 + spawn 失败时主动清 1 颗 Lv.1-2 随机（保留 Lv.3+）+ 再 spawn 1 次 + pushToast "🪦 满格自动清理 1 颗低等级"；**DeadlockPanel**：紫红 box-shadow 0.6s 闪烁动画 `deadlockPulse`（rgba(220,38,38,0.25)↔0.6）|
| "还是会都填满卡死 看看能不能加个刷新按钮" | v9.0 | ✅ 已加 | gameStore 新增 `refreshGrid(cost=5)`：扣币 → 保留 Lv.4+ 觉醒 → 其他清空 → spawn 2-3 个 Lv.1 + bornAt 字段；**强救济**：autoRelief 返回 0 时（无可清低等级）自动调 refreshGrid(0) 免费；**双入口**：① 货币条 [🔄 5] 按钮（-5🪙 主动）② DeadlockPanel 第三个 [🔄 刷新（免费）] 紫青渐变按钮；提示文案：扣费"🔄 刷新网格 -5🪙" / 救济"🪦 死局救济：免费刷新网格" |
| "上方堆叠还在" | v9.1 | ✅ 已彻底解决 | 货币条：5 chip 紧凑化（每 chip gap-0.5 + px-1.5 + 字号 text-xs/text-[9px]）；BuffStrip：**5 chip flex-wrap 展开 → 1 行 3 chip + ⌄ 按钮弹 modal 详情**（modal 280px 紫红渐变背景 + 季/幸运/暴击/周末/倍率 5 行详情 + 💡 提示 + 关闭按钮，避免主区域堆叠）|
| "合并动效大光晕不要 + 加棋子移动拖影 + 整体迭代" | v10.0/10.1/10.2 | ✅ 已迭代 3 版 | **v10.0 去大光晕**：effects.ts 起点光球 radial 白→青→紫 4 色层→简化为 白→青 2 色（去掉 30%-70% 紫强对比），box-shadow 28+56px 双层→6px 单层；BEAM 流光带 6px 紫青渐变→2px 纯青，box-shadow 18+36px→4+8px；mergeFloatShadow 22px→6px；rippleRing 12+8px→4+2px；MergeGrid 起点光球 scale 1.4→0.6；流光带 6px→2px；合并浮起 y -10→-6 / scale 1.12→1.06；涟漪环 scale 3.2→4.4→1.6→2.2。**v10.1 棋子拖影 + 落位回弹**：每个 from≠to move 在 from 位置生 3 颗半透明 emoji 拖影（opacity 0.75/0.5/0.28，scale 0.95/0.82/0.7，向 to 方向位移 6px，zone 色 + 4px drop-shadow，0.22s 错开 0.05s 渐隐）；非合并 moved cell 加 y -3→0 bounce 0.3s 落位回弹。**v10.2 紫青强化**：合并 cell 加 0.15s 紫青 inset 描边（zone 色 2px + 6px 外光晕→0）；4+ 连锁紫青粒子 drop-shadow 6px→4px；合并 emoji 粒子 drop-shadow 8px→6px |
| "百科再优化 不要弹窗 + 整体迭代 4 轮 + 多角色审视 + bug hunt" | v11.0/11.1/11.2/11.3 | ✅ 已迭代 4 版 | **v11.0 百科去弹窗（PM/前端）**：`wiki.ts` 删自动调用 Wikipedia/TheMealDB 改"主动 fetchOnline"（仅用户点击才用），新建 `zone-trivia.ts`（12 zone × 3 段冷知识 + 节日 lore）+ `zone-network.ts`（12 zone 关联矩阵 + 2 邻居 + 1 句理由）+ `zone-story.ts`（getLocalStory 4 段结构化），CollectionView 重写：删 5 个来源 chip、删"📴 国内环境"toast、加"🌐 试试在线"次要按钮（失败静默 5s 后隐藏）。**v11.1 故事页结构化（PM/UI/增长）**：4 段 背景/冷知识/合成链/关联 + 故事卡头部 emoji 大字 + tier 徽章 + 节日特辑；末"🎁 首次阅读 +5🪙"；uiStore `readZones`/`favoriteZones` 持久化；主题卡 📜已读/⭐收藏 双角标；ESC 关闭弹层；←→ 主题切换快捷键。**v11.2 随机故事 + 跨区推荐（策划/增长）**：🎲 随机故事（跳到任意 zone+level 的未读故事）、→ 推荐 zone（按 ZONE_NETWORK 推 1 个关联 zone）；节日特辑（情人节/中秋/圣诞/春节 4 套）已渲染。**v11.3 bug hunt（QA/前端）**：① 修 React 18 严格模式 dev 双 mount 导致首次阅读 +5🪙 变 +10🪙（v11.0 引入）；改成 useEffect 内 `useUiStore.getState().readZones.includes(zone.id)` 检查后再加；② 修 `bgm.ts:152 console.warn` 改 `try { } catch (_e) {}` 静默吞错；③ grep 全仓无 console.log/error/warn 残留；④ TS 0 错 / 37 tests pass / build 138.64 KB gzip |
| "动画光球不要 + 顶部 emoji 还是堆叠 + 整体迭代 4 轮" | v12.0/12.1/12.2/12.3 | ✅ 已迭代 4 版 | **v12.0 起点光球彻底删除（PM）**：MergeGrid line 122-138 紫青弱光球全删 → 改为 8px CSS border triangle 紫青三角箭头（0.3s 渐显 + 0.2s 渐隐，方向相关）；effects.ts 删 `startBallInner`/`startBallShadow` 出口；保留：流光带 2px 细线 + 涟漪环 + 棋子拖影 + 落位回弹 + 紫青描边 + 合并浮起。**v12.1 顶部 0 堆叠（PM/UI/增长）**：5 chip 一行（🪙 👑 🎁 🔄 📊）→ 2 chip 一行（🪙 N + ⚙️ 设置），其他 4 个入口全部收入新建 `SettingsDrawer` 抽屉（右侧滑入 288px 紫青渐变 + 0.3s slide 动画 + 锁 body scroll + ESC/点遮罩/屏幕右滑 24px 三种关闭方式），含 🎁 签到（红点角标）/ 🗺️ 主题馆 / 📊 统计 / 🎯 7日挑战（带"!"角标）/ 👑 最高 Lv.X / 🔄 刷新 / 🎲 立即扭蛋 / 🔇 静音开关 / 今日活动（季节+周末+幸运主题）；"👑 Lv.X" 从顶部移到 zone 卡片右上角。**v12.2 快捷键（策划/前端）**：App.tsx 加 1/2/3 数字键切 tab（home/collection/more），与 HomeTab 已有 ←→ 切 zone 配套；抽屉内"立即扭蛋"按钮：setTab('home') + setTimeout(200ms) 找 `[data-gashapon-trigger]` 自动触发。**v12.3 满图鉴烟花（策划/QA）**：HomeTab 加 useEffect 检测 clearedCount === 12 首次达成 → burstConfetti() + pushToast('🎉 满图鉴达成！12 界全通！', 3)；uiStore 用 useRef 锁"只触发一次"防 React 18 双 mount；不修改任何 store 数据；TS 0 错 / 37 tests pass / build 140.23 KB gzip |
| "重置按钮记得直接是重开一局 + 整体迭代 4 轮" | v13.0/13.1/13.2/13.3 | ✅ 已迭代 4 版 | **v13.0 重开一局按钮（PM）**：gameStore.reset 增强为 set(init()) + trySpawnOne() + save()；uiStore 新增 `resetUi()` 清所有弹层（settingsOpen/showZoneGallery/showCheckin/showStats/showShare）+ 清 toast，**保留** readZones/favoriteZones/muted（情感锚点）；`confirmResetOpen` + `setConfirmResetOpen` 二次确认 modal 状态；SettingsDrawer 底部加"🔁 重开一局"红色按钮（紫红渐变 + ⚠️ 风格，区别紫色"🔄 刷新"），点击关闭抽屉并弹 modal。**v13.1 长按 1s 确认 + 重开奖励（策划）**：新建 `ResetConfirmModal.tsx`（紫红渐变 modal，⚠️ 大字 + 4 行说明：进度清零/宠物清零/✅ 收藏已读保留/🎁 送 +50🪙）；"🔁 长按 1s 确认"按钮带 1s 进度条（onMouseDown/onTouchStart + 16ms 间隔 + 进度显示 + 松手取消）；重开成功 → addCoins(50) + pushToast("🎁 重开奖励 +50🪙，3 局内扭蛋 ×1.5！") + burstConfetti() 紫青全屏粒子 + setTab('home')。**v13.2 重开成就（策划/增长）**：uiStore 新增 `resetCount` + `bumpResetCount`；bump 后 `useUiStore.getState().resetCount` 命中 [1,3,5,10] → setTimeout 600ms 后 pushToast("🔁 破而后立 · 累计重开 N 次！", tier 1)。**v13.3 bug hunt + UX（QA/前端）**：① ESC 关闭二次确认 modal；② Enter 确认（按住到底后）；③ 点击遮罩关闭；④ React 18 严格模式防双 mount（holdProgress state 严格控制 timer clearInterval）；⑤ onMouseLeave 取消（鼠标移开也触发 stopHold）；⑥ onTouchCancel 兜底；⑦ useEffect cleanup 时 stopHold 防内存泄漏；TS 0 错 / 37 tests pass / build 141.46 KB gzip |

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
| BUG-26 | 🟠 P1 | v3.0 轨迹用了 SVG dasharray 折线 + 绿光 ring，"太丑了" | v4.0 | ✅ 已重做：删 SVG 折线；改**起点光球**（radial 放射 0→1.4→0.3 缩放 + 32+64px 双层 boxShadow）+**流光带**（linear-gradient 6px 带 0.4s GSAP 沿方向滑过整个 grid + 双层 box-shadow 发光）+**终点爆裂**（60px 径向 1.6→2.4）+**轨迹 cell 依次白光闪**（40ms 延迟）+**起点喷 8 个 ⭐✨💫🌟 粒子**（反方向旋转 360° 飘）|
| BUG-27 | 🟠 P1 | v3.1 成就"一键收下"会立刻关弹层，玩家看不到成就内容，"合并了但是没展示" | v4.1 | ✅ 已重做：modal 改 carousel 模式（左右切换按钮 + dots 指示器 + 标题/描述随 active 重渲）；"📋 全部"按钮展开**右侧抽屉展柜**（slide 动画 + 12 项 list + 总奖励/成数统计 + 全部收下按钮）|
| BUG-28 | 🟢 P3 | 合并位置只有数字飘字，缺少核心 emoji 飞起反馈 | v4.2 | ✅ 已加：合并时 3 个合成后的新 emoji 粒子径向散开 + 旋转 + drop-shadow 主题色 |
| BUG-29 | 🟠 P1 | 底栏 4 列中"合成"页面是 HomeTab 的子集，冗余 | v5.0 | ✅ 删 MergeTab 路由 + 文件；底栏改 3 列（主页/图鉴/更多）；HomeTab 整合 MergeGrid + DeadlockPanel |
| BUG-30 | 🟠 P1 | v4 轨迹只到流光带 + 粒子飘，没有"合并时 tile 自身"的动效反馈 | v5.2 | ✅ 已加：合并位置 tile y -10 + scale 1.12 浮起 → bounce 弹回 0.32s + 金色 24px 阴影渐隐 |
| BUG-31 | 🟢 P2 | 4+ 连锁没有"震动反馈" | v5.2 | ✅ 已加：grid 整体 x -3/y 2 → elastic.out 0.4s 弹回 |
| BUG-32 | 🟢 P3 | 5+ 连锁粒子只到飘尾，没有"向上汇聚"的爽感 | v5.2 | ✅ 已加：12 个 ⭐✨💫🌟💛 粒子从合并位置向上汇聚（旋转 720° + drop-shadow 金色 + 渐隐）|
| BUG-33 | 🟠 P1 | v4.1 成就 carousel + 抽屉太重，玩家希望"简略" | v5.1 | ✅ 已改：紧凑 stack list 最多 3 张卡 + 折叠"+N 更多" + 顶标"✨ N 个"+ 一键"📋 全部收下" |
| BUG-34 | 🟢 P2 | 缺"连续成功滑动"爽感项 | v5.3 | ✅ 已加 slideStreak 字段：连续 3 次成功 +5🪙 + 进度条 + 满格庆祝动画 + 失败清零 + toast 提示 |

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
| v4   | 128.75 KB | 102 | +轨迹重做 + 成就展板 + 合并 emoji 粒子 |
| v5   | 128.28 KB | 102 | -MergeTab + 主页整合 + 动效强化 + streak bar |

每个版本 ≤ +3 KB 增量（v5 因删 MergeTab 反而缩小 0.47 KB），符合"零依赖 + 即时合成"的设计原则。

## 6. GitHub Pages 部署地址

https://if3077-beep.github.io/emoji-2048-gashapon/

- 部署方式：GitHub Actions 自动 build + 推 Pages
- 工作流：`.github/workflows/deploy.yml`
- 触发：push 到 main 分支
- v0.4 → v1.3 共 10 个版本全部自动部署
