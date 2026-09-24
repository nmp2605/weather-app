import { describe, expect, it, vi } from 'vitest'

import { getApiKey, hasApiKey } from '../env'

describe('env', () => {
  it('reads and trims the API key', () => {
    vi.stubEnv('VITE_OPENWEATHER_API_KEY', '  abc123  ')
    expect(getApiKey()).toBe('abc123')
    expect(hasApiKey()).toBe(true)
  })

  it('reports a blank key as missing', () => {
    vi.stubEnv('VITE_OPENWEATHER_API_KEY', '   ')
    expect(hasApiKey()).toBe(false)
  })

  it('reports an undefined key as missing', () => {
    vi.stubEnv('VITE_OPENWEATHER_API_KEY', undefined)
    expect(getApiKey()).toBe('')
  })
})
