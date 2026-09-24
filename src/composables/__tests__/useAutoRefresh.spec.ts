import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAutoRefresh } from '../useAutoRefresh'
import { setDocumentHidden } from '@/__tests__/helpers/browser'
import { withScope } from '@/__tests__/helpers/scope'

beforeEach(() => {
  vi.useFakeTimers()
  setDocumentHidden(false)
})

describe('useAutoRefresh', () => {
  it('runs on every interval while the page is visible', () => {
    const callback = vi.fn<() => void>()
    withScope(() => useAutoRefresh(callback, 1_000))

    vi.advanceTimersByTime(3_000)
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('skips ticks while the tab is hidden', () => {
    const callback = vi.fn<() => void>()
    withScope(() => useAutoRefresh(callback, 1_000))

    setDocumentHidden(true)
    vi.advanceTimersByTime(3_000)
    expect(callback).not.toHaveBeenCalled()
  })

  it('catches up when a tab comes back after a full interval', () => {
    const callback = vi.fn<() => void>()
    withScope(() => useAutoRefresh(callback, 1_000))

    setDocumentHidden(true)
    vi.advanceTimersByTime(1_500)
    setDocumentHidden(false)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(callback).toHaveBeenCalledOnce()
  })

  it('does not catch up when the tab was hidden only briefly', () => {
    const callback = vi.fn<() => void>()
    withScope(() => useAutoRefresh(callback, 1_000))

    vi.advanceTimersByTime(500)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(callback).not.toHaveBeenCalled()
  })

  it('stops when its scope is disposed', () => {
    const callback = vi.fn<() => void>()
    const { stop } = withScope(() => useAutoRefresh(callback, 1_000))

    stop()
    vi.advanceTimersByTime(5_000)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(callback).not.toHaveBeenCalled()
  })
})
