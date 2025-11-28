import { describe, expect, it, vi } from 'vitest'
import { createProxyTransformer } from '../src'

describe('createProxyTransformer', () => {
  it('parses http proxy and creates rewrite function', () => {
    const tr = createProxyTransformer()
    const env = '[[\'/api\',\'http://localhost:3000\',\'/backend\']]'
    const proxies = tr(env)
    expect(proxies).toHaveProperty('/api')
    const p: any = proxies['/api']
    expect(p.target).toBe('http://localhost:3000')
    expect(p.changeOrigin).toBe(true)
    expect(p.ws).toBe(true)
    // http target should not force secure flag
    expect(p).not.toHaveProperty('secure')
    // rewrite should transform path as expected
    expect(typeof p.rewrite).toBe('function')
    expect(p.rewrite('/api/users')).toBe('/backend/users')
  })

  it('parses https proxy and sets secure=false by default', () => {
    const tr = createProxyTransformer()
    const env = '[[\'/secure\',\'https://example.com\']]'
    const proxies = tr(env)
    expect(proxies).toHaveProperty('/secure')
    const p: any = proxies['/secure']
    expect(p.target).toBe('https://example.com')
    expect(p.secure).toBe(false)
  })

  it('returns empty object and logs on invalid envString', () => {
    const tr = createProxyTransformer()
    const bad = 'this is invalid javascript and will throw'
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {
    })
    const proxies = tr(bad)
    expect(proxies).toEqual({})
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('applies baseProxyOptions and allows per-item overrides', () => {
    const tr = createProxyTransformer({
      baseProxyOptions: { changeOrigin: false },
    })
    const env = '[[\'/api\',\'http://localhost:3000\',undefined,{ ws: false }]]'
    const proxies = tr(env)
    expect(proxies).toHaveProperty('/api')
    const p: any = proxies['/api']
    // baseProxyOptions should set changeOrigin to false
    expect(p.changeOrigin).toBe(false)
    // per-item options should override base
    expect(p.ws).toBe(false)
  })

  it('returns empty object and logs when the evaluated value is not an array', () => {
    const tr = createProxyTransformer()
    const env = '123'
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {
    })
    const proxies = tr(env)
    expect(proxies).toEqual({})
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('produces undefined rewrite when none provided', () => {
    const tr = createProxyTransformer()
    const env = '[[\'/norw\',\'http://localhost:3000\'] ]'
    const proxies = tr(env)
    const p: any = proxies['/norw']
    expect(p.rewrite).toBeUndefined()
  })

  it('returns empty object for empty string', () => {
    const tr = createProxyTransformer()
    expect(tr('')).toEqual({})
    expect(tr('   ')).toEqual({})
    expect(tr('\n\t')).toEqual({})
  })

  it('supports regex pattern in prefix', () => {
    const tr = createProxyTransformer()
    // prefix with regex alternation pattern (longer patterns first for correct matching)
    const env = '[[\'/(api-v2|api)\',\'http://localhost:3000\',\'\']]'
    const proxies = tr(env)
    const p: any = proxies['/(api-v2|api)']
    // should match /api
    expect(p.rewrite('/api/users')).toBe('/users')
    // should match /api-v2
    expect(p.rewrite('/api-v2/users')).toBe('/users')
    // should not match /other
    expect(p.rewrite('/other/users')).toBe('/other/users')
  })
})
