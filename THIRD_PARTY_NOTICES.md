# 数据、素材与第三方组件

体育资料主要来自 [ESPN](https://www.espn.com/) 与 [CBA 官方数据站](https://www.cbaleague.com/data/)。运行资料保留来源、采集时间或统计口径，界面中也展示源站链接与时间。

仓库包含研究与展示使用的公开资料快照，并非由本项目自行授予许可的数据集；使用和再分发应遵守来源条款。代码许可不改变体育数据、队徽和球员照片的权利归属。

- `assets/source-photography/` 为生成的体育摄影风格素材，`public/*.webp` 为网页版本，不代表具体真实比赛的新闻照片。
- 球员头像、球队标识从上游远程加载，不在此授予商标或照片许可。
- 页面通过 Google Fonts 使用字体，未将字体文件打包入仓库。
- `vendor/shadcn-tailwind-4.13.0.LICENSE.md` 和 `scripts/vite/sites-vite-plugin.LICENSE` 保留对应许可。
- JavaScript 依赖见 `package.json` 与 `package-lock.json`，各包保留其许可证。

模拟联赛、生涯与卡牌引擎由本项目实现，未复制 ZenGM 的受限源码。项目与所展示的联赛、球队、体育组织和数据平台无隶属关系。

本项目原创源代码采用 MIT 许可证。该授权不覆盖第三方体育数据快照、远程球员头像、队徽、字体或已有独立许可证的组件；它们按各自来源和许可使用。
