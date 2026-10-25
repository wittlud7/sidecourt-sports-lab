# 架构与数据流

`app/page.tsx` 管理赛事和工作台视图，用 URL hash 定位模块。`app/api/sports/route.ts` 是白名单数据代理：校验赛事、资源与参数，调用 ESPN / CBA 适配层，返回数据、来源、时间与缓存标识。

浏览器 → `lib/client.ts` → `/api/sports` → 上游公开接口。失败时可返回带标识的本机缓存；缺失资料不补造。日期按北京时间筛选。

## 领域模块

- `lib/sports.ts`：类型、赛事列表与数据归一化。
- `lib/cba.ts`、`lib/enrichment.ts`、`lib/player-fallback.ts`：数据适配与可追溯回退。
- `lib/analytics.mjs`、`lib/research-metrics.mjs`：统计口径；缺少分母时不计算。
- `lib/constellation.mjs`：具有类型、年份和证据的人物关系。
- `lib/tactics.mjs`：球场、阵容、身份替换、关键帧、跟随信息与战术修正。
- `lib/manager.mjs`、`lib/immersion.mjs`、`lib/player-life.mjs`：联赛与生涯模拟。
- `lib/card-duel.mjs`：确定性随机、牌库、体能、战术克制与存档校验。
- `lib/localization.mjs`：统一译名、状态和术语。

## 本机状态与测试

`localStorage` 保存笔记、关注、战术、游戏和有限数据缓存。运动与游戏类型使用独立存储键；导入文件有大小和结构校验。没有服务器账号或多设备自动同步。

`npm test` 只枚举 `tests/*.test.mjs`，覆盖统计分母、关系证据、赛季守恒、存档、战术帧、身份替换与卡牌规则，不访问网络。`tests/api-*.mjs` 需启动服务并单独执行。

## 已知限制

- 上游接口可能变更，资料未覆盖所有赛事与历史赛季。
- 足球历史资料以特定赛季名册为主；历史选集可跨年份组合。
- 跑位属于二维示意，不能自动复原完整真实比赛。
- 主页面状态仍较集中；历史档案和功能面板现已按需加载，后续可继续拆分视图状态。
- 尚未加入云存档、用户系统或多人对战。
