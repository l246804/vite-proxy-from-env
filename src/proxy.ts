import type { ProxyOptions, UserConfig } from 'vite'

export type ProxyItem = [
  /**
   * URL prefix to match. Supports regular expression patterns.
   * @example '/api' - matches paths starting with /api
   * @example '/(api|api-v2)' - matches paths starting with /api or /api-v2
   */
  prefix: string,
  /** Target server URL */
  target: string,
  /**
   * Replacement string for path rewriting.
   * The matched `prefix` pattern will be replaced with this value.
   */
  rewrite?: string,
  /** Additional proxy options */
  options?: Omit<ProxyOptions, 'target' | 'rewrite'>,
]

export type ProxyList = ProxyItem[]

export type ViteProxy = NonNullable<NonNullable<UserConfig['server']>['proxy']>
