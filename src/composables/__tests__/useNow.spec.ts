import { describe, expect, it, vi } from 'vitest'

import { useNow } from '../useNow'
import { withScope } from '@/__tests__/helpers/scope'

describe('useNow', () => {
  it('ticks in Unix seconds until disposed', () => {
    vi.useFakeTimers({ now: new Date('2026-09-23T18:00:00Z') })
    const { result: now, stop } = withScope(() => useNow(30_000))
    const start = Date.parse('2026-09-23T18:00:00Z') / 1000

    expect(now.value).toBe(start)
    vi.advanceTimersByTime(30_000)
    expect(now.value).toBe(start + 30)

    stop()
    vi.advanceTimersByTime(60_000)
    expect(now.value).toBe(start + 30)
  })
})
