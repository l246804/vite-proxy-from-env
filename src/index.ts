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

export type ProxyTransformer = (
  envStringOrArray: string | ProxyList,
) => ViteProxy

const HTTPS_RE = /^https:\/\//

/**
 * Creates a proxy transformer function that converts an env string or ProxyList array into Vite proxy configuration.
 * @example
 * ```ts
 * const transformer = createProxyTransformer()
 *
 * // Parse proxy from env string
 * transformer("[['/api','http://localhost:3000','/backend']]")
 *
 * // Or pass ProxyList array directly
 * transformer([['/api', 'http://localhost:3000', '/backend']])
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
  return (envStringOrArray): ViteProxy => {
    // 直接传入 ProxyList 数组
    if (Array.isArray(envStringOrArray)) {
      return transformProxyList(envStringOrArray, options)
    }

    if (!envStringOrArray || !envStringOrArray.trim()) {
      return {}
    }

    try {
      // 将传入的 envStringOrArray 作为数组字面量执行并返回 ProxyList
      // envStringOrArray 预期为数组字面量，例如：
      // "[['/api','http://localhost:3000','']]"
      // eslint-disable-next-line no-new-func
      const list: ProxyList = new Function(`return ${envStringOrArray}`)()

      if (!Array.isArray(list)) {
        throw new TypeError('envStringOrArray does not evaluate to an array')
      }

      return transformProxyList(list, options)
    }
    catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.error(
        `[vite-proxy-from-env] Failed to parse proxy string.\n` +
        `  Input: ${envStringOrArray}\n` +
        `  Error: ${message}`,
      )
      return {}
    }
  }
}

/**
 * Transforms a ProxyList array into Vite proxy configuration.
 */
function transformProxyList(
  list: ProxyList,
  options: CreateProxyTransformerOptions,
): ViteProxy {
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

/**
 * A default proxy transformer instance.
 * @example
 * ```ts
 * // Parse proxy from env string
 * const proxies = proxyTransformer("[['/api','http://localhost:3000','/backend']]")
 *
 * // Or pass ProxyList array directly
 * const proxies = proxyTransformer([['/api', 'http://localhost:3000', '/backend']])
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
