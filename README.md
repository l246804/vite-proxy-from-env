# vite-proxy-from-env

根据 `.env` 文件内的变量获取 Vite 服务代理配置。

## 用法

本包用于将 `.env` 中的数组字面量转换为 Vite 的 `server.proxy` 配置。

示例环境变量值（应为数组字面量）：

```bash
# 开发代理，推荐在本地增加 `.env.development.local` 文件覆该变量值
# 注意：不推荐在数组内的字符串使用 `"`，避免多行文本被截断
DEV_PROXY="[
  // http://localhost:3000/api/test => http://localhost:3000/test
  ['/api','http://localhost:3000',''],

  // http://localhost:3000/secure/test => http://localhost:3000/secure/test
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

说明：

- 转换器期望从 `.env` 中读取到用于描述代理的数组字面量。
- 每个代理条目为 `[prefix, target, rewrite?, options?]`。
- 对于 `https` 目标，转换器默认会将 `secure: false`，以便在开发时接受自签名证书。

## 赞助

您的支持是我持续改进的动力！如果该项目对您有帮助，可以考虑请作者喝杯果汁🍹：

| 微信                                    | 支付宝                                   |
| --------------------------------------- | ---------------------------------------- |
| <img src="./public/wx.png" width="200"> | <img src="./public/zfb.png" width="200"> |

## 许可证

[MIT](./LICENSE) 许可证 © 2025 [leihaohao](https://github.com/l246804)
