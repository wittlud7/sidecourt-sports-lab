# 场边 SIDECOURT

面向中文体育解说与个人研究的体育数据工作台，包含赛事与球员资料、关系图谱、战术演练、备课与模拟游戏。

[在线体验](https://sidecourt-sports-lab.youngcoin22.chatgpt.site/) · [战术板说明](TACTICS.md) · [架构](docs/architecture.md) · [数据与素材来源](THIRD_PARTY_NOTICES.md)

## 功能

| 模块 | 功能 |
| --- | --- |
| 比赛与球队 | NBA、CBA、五大联赛、欧冠及国际大赛的赛程、比分、阵容、排名和技术统计 |
| 球员与对比 | 现役与历史资料、场均与累计口径、数据雷达、CSV 导出 |
| 人物关系图谱 | 同期队友、跨时代同队、国家队等关系；年份与证据、最短路径、SVG 导出 |
| 战术板 | 篮球 5 对 5、足球 11 对 11；球队选择、球员替换、跟随视角、关键帧跑位、战术库 |
| 解说备课 | 比赛资料、观察问题、战术笔记、Markdown/JSON 备份与打印 |
| 跨时代俱乐部 | 真实姓名选秀、轮换、体能、转会、合同、董事会与多赛季 |
| 球员人生 | 从 18 岁开始安排训练、争取角色、处理伤病与合同 |
| 球场手牌 | 篮球/足球卡牌阵容、12 回合攻防、战术克制、轮换、队长技能与战绩 |

界面采用纸白、墨色与酒红的体育刊物风格，支持桌面和手机。

## 本地运行

需要 Node.js 24 LTS 和 npm。普通浏览与模拟游戏无需体育 API 密钥。

```sh
npm ci
npm run dev
```

打开 `http://127.0.0.1:5173`。

```sh
npm test               # 离线测试
npm run typecheck      # TypeScript 检查
npm run build          # 生产构建
npm run check:bundle   # 首屏依赖与体积预算
npm start              # 生产预览，地址以终端输出为准
```

Windows 下若 npm 命令 shim 异常，可以用 `npm.cmd`，或直接执行 `node scripts/run-framework.mjs dev`。

GitHub Actions 在推送和 PR 时执行安装、测试、类型检查与构建。联网数据检查独立运行：先启动开发服务，再执行 `node tests/api-smoke.mjs`、`node tests/api-v2-smoke.mjs`。可通过 `SIDECOURT_TEST_ORIGIN` 指向其他预览地址。

模块与历史档案按需加载，性能测量和预算见 [性能说明](docs/performance.md)。

## 数据与模拟

- ESPN 与 CBA 官方公开网站提供赛程、名单和统计；可能延迟、缺项或变更，界面展示来源、时间与缓存状态。CBA 统计名单不是完整注册名单。
- 历史档案是带来源的收录子集。生涯、单赛季和近期比赛样本分别标记，缺失数据保留为空。
- 图谱区分同期队友、跨时代同队、国籍与国家队关系，不推断私人关系。
- 战术动画是编排示意，不是实赛位置追踪。游戏评分、合同、伤病与赛果均为模拟。
- 笔记、关注、战术和游戏进度保存在当前浏览器，不自动跨设备同步。清理浏览器数据前请导出备份。

原创源代码采用 [MIT 许可证](LICENSE)。体育数据快照、上游头像、队徽、字体与第三方组件不因代码开源而改变其许可或权利归属，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 目录

```text
app/                       页面、样式与体育数据 API
components/                比赛、球员、图谱、战术、备课与游戏界面
lib/                       数据适配、统计方法与模拟引擎
data/                      历史资料、快照与中文译名
public/                    网页图片和图标
assets/source-photography/ 图片原稿
scripts/                   运行、资料采集与构建工具
tests/                     离线规则测试与独立联网检查
docs/                      架构、视觉与中文化说明
```

## 部署

技术栈为 Vinext、React、TypeScript 与 Cloudflare Workers。生产 Worker 和静态资源输出到 `dist/`。

`.openai/hosting.json` 只保留无绑定的本地配置，没有原网站的项目 ID。部署到自己的 Sites 项目时，由部署工具填入自己的项目 ID；其他 Cloudflare 环境需按构建输出配置 Worker、静态资源和绑定。保留现有 Sites/Vinext 构建集成。

## 资料采集

采集不属于日常启动步骤。已有运行资料随仓库提供；重新采集依赖上游公开接口。

```sh
node scripts/collect-archive.mjs
node scripts/collect-cba-archive.mjs
node scripts/verify-archive-photos.mjs
```

采集缓存保存在被忽略的 `research/`，运行时数据位于 `data/`。
