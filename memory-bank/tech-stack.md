# DanceCARD 技术栈选型

- 文档版本：V1.0
- 文档状态：已确认
- 依据文档：`Design-Document.md`
- 产品路线：V1 正式发布移动端 H5；微信端仅保证可构建并通过开发者工具冒烟测试

## 1. 选型结论

舞卡采用以下主技术方案：

> **Taro 4 + React + TypeScript + 腾讯云 CloudBase PostgreSQL**

该方案兼顾移动端 Web 的开发速度、中国大陆用户的访问体验、关系型业务数据、微信登录，以及后续迁移微信小程序时的代码复用。

## 2. 技术栈总览

| 模块 | 技术选择 |
| --- | --- |
| 用户端 | Taro 4 + React + TypeScript |
| 编译工具 | Vite |
| UI 组件 | NutUI Taro |
| 样式 | SCSS + CSS Variables |
| 表单校验 | Zod |
| 后端平台 | 腾讯云 CloudBase |
| 数据库 | CloudBase PostgreSQL |
| 用户认证 | CloudBase Auth |
| 后端业务逻辑 | Node.js + TypeScript 云函数 |
| Web 托管 | CloudBase 静态网站托管 |
| 管理后台 | React + Vite + TypeScript + Ant Design |
| 包管理 | pnpm workspace |
| 代码规范 | ESLint + Prettier |
| 单元测试 | Vitest + Testing Library |
| Web 端到端测试 | Playwright |

## 3. 整体架构

```text
                  Taro 用户端代码
                    /         \
                   /           \
              H5 Web        微信小程序
                   \           /
                    \         /
                    CloudBase Auth
                           |
                  CloudBase 云函数 / API
                           |
                  CloudBase PostgreSQL
                           |
                React 管理后台（独立 Web）
```

用户端 H5 和微信小程序共享页面、组件、业务规则和数据访问接口；管理后台独立开发，不需要迁移至小程序。

## 4. 用户端技术方案

### 4.1 Taro 4

Taro 负责将同一套用户端代码构建为：

- H5 移动网页。
- 微信小程序。

项目使用 Taro 4.x，并在项目初始化时锁定经过验证的具体版本，不盲目自动升级主版本。

### 4.2 React

用户端使用 Taro 官方模板支持的 React 版本。

React 负责：

- 页面组件。
- 次卡列表和表单组件。
- 登录状态展示。
- 页面交互和业务状态。

不额外引入 Redux。V1 状态较少，优先使用：

- React Hooks。
- React Context 管理登录状态。
- 路由参数传递城市、区域和舞室 ID。

后续只有在全局状态明显复杂时再引入轻量状态库。

### 4.3 TypeScript

所有用户端、管理后台及云函数代码统一使用 TypeScript。

核心业务类型包括：

- `User`
- `City`
- `District`
- `Studio`
- `DanceCard`
- `DanceCardVisibility`
- `AuthIdentity`

前后端尽可能共享领域类型和校验规则。

### 4.4 Vite

Taro 项目使用 Vite 编译，以获得较快的本地开发和构建体验。

### 4.5 跨端开发约束

为确保 H5 代码能够顺利构建为微信小程序，用户端必须遵守以下规则：

- 页面结构优先使用 Taro 的 `View`、`Text`、`Button`、`Input` 等跨端组件。
- 不在共享业务代码中直接调用 `window`、`document` 或浏览器专属 API。
- 复制、导航、缓存等能力通过 Taro API 或统一的平台适配层调用。
- 不依赖仅支持 React DOM 的组件库。
- 平台专属实现放入独立的适配文件，不散落在业务组件中。
- H5 和微信小程序构建都必须进入持续验证流程。

## 5. UI 与样式方案

### 5.1 NutUI Taro

NutUI Taro 作为基础移动端组件库，主要使用：

- Button
- Input
- Form
- DatePicker
- Dialog
- Toast
- Empty
- Tabbar
- Popup

NutUI 只承担基础交互能力，具体品牌视觉由舞卡自己的样式控制。

### 5.2 SCSS + CSS Variables

使用 SCSS 编写页面与组件样式，并通过 CSS Variables 维护：

- 品牌色。
- 文字颜色。
- 背景色。
- 间距。
- 圆角。
- 阴影。
- 字体尺寸。

UI 参考图保存在 `memory-bank/assets/ui-reference.png`。实现时提取其深色编辑感设计语言：近黑底色、暖白文字、珊瑚橙主操作、暗金辅助信息、冷灰蓝细线框、紧缩数字编号和小圆角矩形。不使用渐变、玻璃拟态、大圆角气泡卡片或大面积高饱和色块。旧 Neo-pop 参考已归档为 `memory-bank/assets/ui-reference-neo-pop-archive.png`，不再作为当前实现依据。正文信息区必须优先保证清晰度和价格比较效率。

V1 暂不引入 Tailwind。舞卡页面结构简单，而 Tailwind 在小程序端需要额外转换和兼容配置，当前收益不足以抵消复杂度。

### 5.3 表单校验

使用 Zod 定义跨端共享的数据校验规则，例如：

- 剩余课时必须是正整数。
- 单节价格必须大于 0。
- 使用截止日期不得早于当前日期。
- “全部舞种”与指定舞种互斥。
- 选择“其他”舞种后必须填写自定义名称。
- 昵称和微信号不能为空。
- 课时、金额及文本长度遵循 Design Document 的明确上限。

所有日期计算统一使用 `Asia/Shanghai`，截止日期当天 23:59:59 前有效。金额在数据库中使用精确十进制或等价的分单位方案，禁止使用浮点数直接保存人民币金额。

## 6. 后端平台

### 6.1 腾讯云 CloudBase

CloudBase 统一提供：

- 用户认证。
- PostgreSQL 数据库。
- 云函数。
- HTTP API。
- 定时任务。
- H5 静态网站托管。
- 微信小程序云能力。

采用统一平台可以减少多家云服务之间的账号、网络、鉴权和部署配置。

### 6.2 为什么不使用 Supabase

Supabase 开发体验较好，但官方托管服务目前没有中国大陆区域。舞卡主要服务中国大陆用户，并计划迁移微信小程序，因此使用 Supabase 会增加以下风险：

- 中国大陆网络访问稳定性和延迟的不确定性。
- 微信小程序后端域名配置成本。
- 微信登录的自定义接入工作。
- 数据部署和后续合规评估成本。

因此舞卡选择与微信生态结合更紧密的 CloudBase。

## 7. 数据库方案

### 7.1 CloudBase PostgreSQL

舞卡的数据具有清晰的关系结构：

```text
City
└── District
    └── Studio
        └── DanceCard
            └── User
```

因此使用关系型 PostgreSQL，而不使用文档数据库。

CloudBase PostgreSQL 提供完整 SQL、PostgREST 接口和行级权限 RLS，适合实现：

- 游客可以浏览公开次卡。
- 登录用户只能修改自己的次卡。
- 管理员可以管理城市、区域、舞室和违规内容。
- 过期、隐藏及软删除条件由数据库查询统一执行。

### 7.2 核心数据表

V1 包含以下主要数据表：

- `users`
- `user_identities`
- `cities`
- `districts`
- `studios`
- `dance_cards`
- `admin_action_logs`

`user_identities` 用于把手机号和未来的微信身份关联到内部业务用户，避免业务数据与某一种登录方式绑定。

### 7.3 权限规则

数据库至少需要以下 RLS 规则：

- 游客只能读取启用的城市、区域和舞室。
- 游客只能读取公开、未过期、未删除的次卡。
- 登录用户只能创建归属于自己的次卡。
- 登录用户只能编辑、隐藏或删除自己的次卡。
- 普通用户不能恢复被管理员隐藏的次卡。
- 只有管理员可以维护城市、区域和舞室。
- 公开批量查询不能返回微信号。
- 城市、区域、舞室任一级停用时，其下次卡停止公开。
- 发布用户被禁用时，其次卡停止公开。
- 上述停用只影响公开读取，不自动删除历史数据。

## 8. 身份认证方案

### 8.1 V1 H5

V1 使用 CloudBase 手机号短信验证码认证：

- 手机号首次验证成功时自动创建普通用户账号。
- 后续使用相同手机号和短信验证码登录，不设置密码。
- 买家浏览和复制卖家微信号不需要登录。
- 短信签名、模板、频率控制和费用配置属于上线前置条件。

### 8.2 管理员

- 后台不开放管理员注册。
- 运营方指定手机号首次完成验证码登录后，由 CloudBase 控制台手动提升为首个管理员；真实手机号只保存在受控运行环境中。
- 后续管理员只能由已有管理员或受控运维流程设置。

### 8.3 微信小程序

V1 不实现微信登录，不提交审核、不发布且不要求真机验收。只保证微信小程序构建成功，并在微信开发者工具中完成页面级冒烟测试。

后续小程序正式迁移时增加微信 OpenID 登录，并通过 `user_identities` 将微信身份与现有手机号业务用户关联。

## 9. 云函数与 API

云函数使用 Node.js + TypeScript。

以下能力应通过云函数或受保护的后端接口实现：

- 获取卖家微信号。
- 发布、编辑、隐藏、恢复和删除次卡。
- 管理员维护城市、区域和舞室。
- 管理员隐藏或删除违规次卡。
- 绑定不同登录身份。
- 记录管理员操作。
- 定时处理过期次卡。

### 9.1 微信号保护

微信号不能出现在公开次卡列表或详情的普通数据响应中。

V1 允许游客直接执行单条联系方式获取，不增加登录、验证码或频率限制；接口仍必须只接受单个公开有效次卡 ID，并再次检查用户、城市、区域、舞室和次卡状态。

联系流程：

```text
用户点击卖家昵称或“联系卖家”
→ 展示风险提示
→ 调用联系接口
→ 接口返回当前次卡对应的微信号
→ 客户端复制微信号
```

### 9.2 过期处理

采用双重保障：

1. 公开列表查询实时排除截止日期早于当前日期的次卡。
2. 每日定时任务将过期记录标记为过期隐藏，便于管理与统计。

## 10. 管理后台

管理后台使用：

> React + Vite + TypeScript + Ant Design

后台是桌面 Web 工具，不需要迁移到微信小程序，因此独立于 Taro 用户端开发。

主要功能：

- 城市管理。
- 行政区域管理。
- 舞室添加、编辑和重复检查。
- 次卡检索、隐藏和删除。
- 用户查看和禁用。
- 管理员操作记录。

独立的基础管理后台属于 V1 必做范围。CloudBase 控制台只用于首次设置管理员、环境配置和紧急运维，不作为日常内容管理界面。

## 11. 部署方案

### 11.1 H5 Web

- 构建：Taro H5 Build。
- 托管：CloudBase 静态网站托管。
- API：CloudBase 云函数 / HTTP API。
- 数据库：CloudBase PostgreSQL。

测试阶段可以使用平台提供的默认域名。

正式对外发布时需要准备：

- 自定义域名。
- HTTPS 证书。
- ICP 备案。

### 11.2 微信小程序

- 使用同一个 CloudBase 后端环境。
- 使用 Taro 构建微信小程序产物。
- 使用微信开发者工具完成冒烟测试。
- 不实现微信登录，不上传审核、不发布且不要求真机验收。

### 11.3 管理后台

- 使用 Vite 构建静态资源。
- 部署至 CloudBase 静态网站托管。
- 只允许管理员角色访问后台功能。

## 12. 工程结构建议

使用 pnpm workspace 管理单一代码仓库：

```text
wuka/
├── apps/
│   ├── user-app/          # Taro 用户端：H5 + 微信小程序
│   └── admin-web/         # React 管理后台
├── packages/
│   ├── domain/            # 共享业务类型和规则
│   ├── validation/        # Zod 校验规则
│   ├── api-client/        # API 调用与平台适配
│   └── config/            # 共享 TypeScript、ESLint 配置
├── cloudfunctions/        # CloudBase 云函数
├── database/
│   ├── migrations/        # 数据库迁移
│   ├── policies/          # RLS 权限规则
│   └── seeds/             # 初始城市、区域和舞室数据
└── memory-bank/
    ├── Design-Document.md
    ├── tech-stack.md
    ├── implementation-plan.md
    ├── architecture.md
    ├── progress.md
    └── assets/
        └── ui-reference.png
```

## 13. 测试方案

### 13.1 单元测试

使用 Vitest 测试：

- 价格和课时校验。
- 截止日期规则。
- 舞种选择规则。
- 次卡公开条件。
- 权限判断辅助函数。

### 13.2 组件测试

使用 Testing Library 测试：

- 次卡列表项。
- 发布表单。
- 登录状态。
- 隐藏与删除确认。

### 13.3 H5 端到端测试

使用 Playwright 覆盖：

- 城市 → 区域 → 舞室 → 次卡 → 联系卖家。
- 登录 → 发布次卡。
- 我的次卡 → 编辑、隐藏、恢复和删除。
- 管理员维护舞室和处理违规内容。

### 13.4 小程序验证

从项目早期开始定期执行微信小程序构建，并在微信开发者工具中完成关键页面冒烟测试。V1 不要求微信登录、提交审核、发布或真机验收。

## 14. 暂不采用的技术

### Next.js

舞卡不依赖 SEO 或服务端渲染，且 Next.js 页面不能直接复用为微信小程序，因此不作为用户端框架。

### Supabase

不作为主后端，原因是中国大陆访问及微信生态接入的不确定性。

### Tailwind CSS

V1 不采用，避免增加小程序端样式转换和兼容配置。

### Redux

V1 状态规模较小，不需要引入较重的全局状态方案。

### 自建服务器

V1 不部署和维护传统服务器，使用 CloudBase Serverless 能力降低运维成本。

## 15. 参考资料

- [Taro 官方文档](https://docs.taro.zone/docs/)
- [Taro 编译配置](https://docs.taro.zone/docs/config-detail)
- [NutUI Taro](https://nutui.jd.com/taro/react/1x/)
- [CloudBase PostgreSQL](https://docs.cloudbase.net/database/configuration/db/postgresql/initialization)
- [CloudBase 身份认证](https://docs.cloudbase.net/authentication/auth/introduce)
- [CloudBase 功能说明](https://cloud.tencent.com/document/product/876/40406)
- [CloudBase 自定义域名](https://docs.cloudbase.net/service/custom-domain)
- [Supabase 可用区域](https://supabase.com/docs/guides/platform/regions)

## 16. 最终定义

```text
用户端：
Taro 4 + React + TypeScript + Vite
NutUI Taro + SCSS

管理后台：
React + Vite + TypeScript + Ant Design

后端：
CloudBase Auth
CloudBase PostgreSQL
Node.js + TypeScript 云函数
CloudBase 静态网站托管

V1 认证：
手机号 + 短信验证码
首个管理员由 CloudBase 控制台手动设置
首个管理员手机号：仅在受控运行环境中配置，不写入公开代码仓库

工程：
pnpm workspace
ESLint + Prettier
Vitest + Playwright
```

这套方案作为舞卡 V1 的正式技术选型。后续技术设计、数据库设计和项目初始化均以此文档为依据。
