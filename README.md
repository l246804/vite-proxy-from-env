# vite-proxy-from-env

根据 `.env` 文件内的变量获取 Vite 服务代理配置。

## 安装

```bash
npm install vite-proxy-from-env -D
```

## 用法

本包用于将 `.env` 中的数组字面量转换为 Vite 的 `server.proxy` 配置。

### 基础配置

示例环境变量值（应为数组字面量）：

```bash
# 开发代理，推荐在本地增加 `.env.development.local` 文件覆盖该变量值
# 注意：不推荐在数组内的字符串使用 `"`，避免多行文本被截断
DEV_PROXY="[
  // /api/test => http://localhost:3000/test
  ['/api','http://localhost:3000',''],

  // /secure/test => https://example.com/secure/test
  ['/secure','https://example.com']
]"
```

在 Vite 配置中使用该转换器示例：

```ts
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import { proxyTransformer } from 'vite-proxy-from-env'

export default defineConfig(({ mode }) => {
  // 这里需要把 envPrefix 设为 ''，
  // 否则需要把 DEV_PROXY 改为 VITE_DEV_PROXY
  const env = loadEnv(mode, process.cwd(), '')
  return {
    server: {
      proxy: proxyTransformer(env.DEV_PROXY),
    },
  }
})
```

### 直接传递数组

除了解析环境变量字符串外，转换器也支持直接传递 `ProxyList` 数组，适用于在代码中直接配置代理的场景：

```ts
import type { ProxyList } from 'vite-proxy-from-env'
import { defineConfig } from 'vite'
import { proxyTransformer } from 'vite-proxy-from-env'

const proxyList: ProxyList = [
  ['/api', 'http://localhost:3000', ''],
  ['/upload', 'http://localhost:4000'],
]

export default defineConfig({
  server: {
    proxy: proxyTransformer(proxyList),
  },
})
```

### 多环境代理配置

在团队协作开发中，不同开发者可能需要连接不同的后端环境（如测试环境、预发环境、本地服务等）。推荐在 `.env.development.local` 文件中通过注释保存多套代理配置，按需切换使用：

```bash
# ===========================================
# 多环境代理配置（取消注释对应环境即可切换）
# ===========================================

# ---------- 测试环境 ----------
DEV_PROXY="[
  ['/api','https://test-api.example.com'],
  ['/upload','https://test-upload.example.com']
]"

# ---------- 预发环境 ----------
# DEV_PROXY="[
#   ['/api','https://staging-api.example.com'],
#   ['/upload','https://staging-upload.example.com']
# ]"

# ---------- 本地后端服务 ----------
# DEV_PROXY="[
#   ['/api','http://localhost:8080',''],
#   ['/upload','http://localhost:9000','']
# ]"

# ---------- 联调环境（指定同事的开发机） ----------
# DEV_PROXY="[
#   ['/api','http://192.168.1.100:8080',''],
#   ['/upload','http://192.168.1.100:9000','']
# ]"
```

> 💡 **提示**：`.env.development.local` 文件通常被 `.gitignore` 忽略，不会提交到版本库，因此每个开发者可以根据自己的需求自由配置。

### 配置说明

- 转换器期望从 `.env` 中读取到用于描述代理的数组字面量。
- 每个代理条目为 `[prefix, target, rewrite?, options?]`。
- 对于 `https` 目标，转换器默认会将 `secure: false`，以便在开发时接受自签名证书。

### 参数说明

| 参数      | 类型     | 必填 | 说明                                                                                          |
| --------- | -------- | ---- | --------------------------------------------------------------------------------------------- |
| `prefix`  | `string` | ✅   | 需要代理的请求路径前缀                                                                        |
| `target`  | `string` | ✅   | 代理目标地址                                                                                  |
| `rewrite` | `string` | ❌   | 路径重写规则，设为 `''` 表示去除前缀                                                          |
| `options` | `object` | ❌   | 额外的代理选项，参考 [http-proxy 选项](https://github.com/http-party/node-http-proxy#options) |

## 赞助

您的支持是我持续改进的动力！如果该项目对您有帮助，可以考虑请作者喝杯果汁🍹：

| 微信                                    | 支付宝                                   |
| --------------------------------------- | ---------------------------------------- |
| <img src="./public/wx.png" width="200"> | <img src="./public/zfb.png" width="200"> |

## 许可证

[MIT](./LICENSE) 许可证 © 2025 [leihaohao](https://github.com/l246804)
