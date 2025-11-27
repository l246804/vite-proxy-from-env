import type { ProxyOptions, UserConfig } from 'vite'

export type ProxyItem = [
  prefix: string,
  target: string,
  rewrite?: string,
  options?: Omit<ProxyOptions, 'target' | 'rewrite'>,
]

export type ProxyList = ProxyItem[]

export type ViteProxy = NonNullable<NonNullable<UserConfig['server']>['proxy']>
