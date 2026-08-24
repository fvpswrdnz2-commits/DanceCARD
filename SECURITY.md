# 安全政策 / Security Policy

## 支持版本 / Supported Version

DanceCARD 目前处于 MVP 阶段。安全修复仅适用于 `main` 分支的最新提交，旧版本不再维护。

DanceCARD is currently an MVP. Security fixes apply to the latest commit on `main`; older revisions are not maintained.

## 报告安全问题 / Reporting a Vulnerability

如果发现漏洞、凭据泄露、越权访问或个人数据泄露，请勿创建公开的 GitHub Issue。请发送邮件至 `m18800126467@163.com`，并提供：

- 受影响的页面、函数或文件；
- 复现步骤；
- 潜在影响；
- 已移除个人数据的截图或最小验证示例。

Do not open a public GitHub issue for vulnerabilities, exposed credentials, authorization bypasses, or personal-data leaks. Send a concise report to `m18800126467@163.com` with:

- the affected page, function, or file;
- reproduction steps;
- the potential impact;
- screenshots or a minimal proof of concept, with personal data removed.

请勿访问、修改或保留其他用户的数据，并在公开披露前为调查和修复预留合理时间。

Do not access, alter, or retain data belonging to other users. Allow reasonable time for investigation before public disclosure.

## 仓库密钥 / Repository Secrets

仓库只能跟踪 `.env.example` 中的占位值。CloudBase 凭据、数据库地址、短信密钥、维护令牌、管理员身份和真实用户记录必须保存在被忽略的本地文件或受管理的云端配置中。

Only placeholder values belong in tracked `.env.example` files. CloudBase credentials, database URLs, SMS secrets, maintenance tokens, administrator identities, and real user records must remain in ignored local files or managed cloud configuration.
