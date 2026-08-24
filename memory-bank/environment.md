# DanceCARD 环境配置

## 环境划分

- `development`：本机开发，连接独立 CloudBase 开发环境。
- `test`：自动化测试与上线前验收，使用非生产数据。
- `production`：正式 H5 与管理后台，只连接生产环境。

三套环境不得复用数据库、认证用户或服务端凭据。CloudBase 环境 ID 和 API 地址属于公开客户端配置；数据库连接串等凭据只能存在于云函数运行环境。

## 本地配置

复制对应示例文件后填写真实值：

- 用户端：`apps/user-app/.env.example`
- 管理后台：`apps/admin-web/.env.example`
- 云函数：`cloudfunctions/.env.example`

用户端变量必须使用 `TARO_APP_` 前缀，管理端变量必须使用 `VITE_` 前缀。这两类变量会进入浏览器或小程序构建产物，严禁保存 `DATABASE_URL`、私钥、短信密钥或管理员凭据。

本地 `.env` 文件已被 Git 忽略，所有示例文件保持可跟踪。缺少必填公开配置时，应用会在启动阶段抛出带变量名和示例文件路径的错误。

## 发布检查

构建测试或生产版本前，先确认 API 地址、CloudBase 环境 ID 与目标环境一致。服务端秘密通过 CloudBase 控制台配置，不写入仓库、客户端配置、构建日志或截图。
