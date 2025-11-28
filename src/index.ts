import type { ProxyOptions } from 'vite'
import type { ProxyList, ViteProxy } from './proxy'

export type * from './proxy'

export interface CreateProxyTransformerOptions {
  /**
   * Base proxy options applied to all proxies.
   * @default
   * ```ts
   * { changeOrigin: true, ws: true, secure: /^https:\/\//.test(target) && false }
   * ```
   */
  baseProxyOptions?: Omit<ProxyOptions, 'target' | 'rewrite'>
}

export type ProxyTransformer = (envString: string) => ViteProxy

const HTTPS_RE = /^https:\/\//

/**
 * Creates a proxy transformer function that converts an env string into Vite proxy configuration.
 * @example
 * ```ts
 * const transformer = createProxyTransformer()
 *
 * // Parse proxy from env string
 * transformer("[['/api','http://localhost:3000','/backend']]")
 *
 * // Returns:
 * {
 *   '/api': {
 *     target: 'http://localhost:3000',
 *     changeOrigin: true,
 *     ws: true,
 *     rewrite: (path) => path.replace(new RegExp('/api'), '/backend')
 *   }
 * }
 * ```
 */
export function createProxyTransformer(
  options: CreateProxyTransformerOptions = {},
): ProxyTransformer {
  return (envString): ViteProxy => {
    try {
      // 将传入的 envString 作为数组字面量执行并返回 ProxyList
      // envString 预期为数组字面量，例如：
      // "[['/api','http://localhost:3000','']]"
      // eslint-disable-next-line no-new-func
      const list: ProxyList = new Function(`return ${envString}`)()

      if (!Array.isArray(list)) {
        throw new TypeError('envString does not evaluate to an array')
      }

      const proxies: ViteProxy = {}

      for (const item of list) {
        if (!Array.isArray(item) || item.length < 2) {
          continue
        }

        const [prefix, target, rewrite, proxyOptions] = item
        if (typeof prefix !== 'string' || typeof target !== 'string') {
          continue
        }

        // 对于 https 目标，默认将 `secure` 设为 false，
        // 以便本地开发中自签名证书不会导致失败
        const defaultOptions: ProxyOptions = {
          changeOrigin: true,
          ws: true,
          ...(HTTPS_RE.test(target) ? { secure: false } : {}),
        }

        proxies[prefix] = {
          ...defaultOptions,
          ...options.baseProxyOptions,
          ...proxyOptions,
          target,
          rewrite:
            typeof rewrite === 'string'
              ? (path) => path.replace(new RegExp(prefix), rewrite)
              : undefined,
        }
      }

      return proxies
    }
    catch (e: any) {
      console.error(`[vite-proxy-from-env] parse proxy string error: ${e}`)
      return {}
    }
  }
}

/**
 * A default proxy transformer instance.
 * @example
 * ```ts
 * // Parse proxy from env string
 * const proxies = proxyTransformer("[['/api','http://localhost:3000','/backend']]")
 *
 * // Returns:
 * {
 *   '/api': {
 *     target: 'http://localhost:3000',
 *     changeOrigin: true,
 *     ws: true,
 *     rewrite: (path) => path.replace(new RegExp('/api'), '/backend')
 *   }
 * }
 * ```
 */
export const proxyTransformer = /* @__PURE__ */ createProxyTransformer()
