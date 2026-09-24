import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAutoRefresh } from '../useAutoRefresh'
import { setDocumentHidden } from '@/__tests__/helpers/browser'
import { withScope } from '@/__tests__/helpers/scope'

const INTERVAL = 1_000

function startAutoRefresh() {
  const callback = vi.fn<() => void>()
  const { stop } = withScope(() => useAutoRefresh(callback, INTERVAL))
  return { callback, stop }
}

function becomeVisible() {
  setDocumentHidden(false)
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.useFakeTimers()
  setDocumentHidden(false)
})

describe('useAutoRefresh', () => {
  it('runs on every interval while the page is visible', () => {
    const { callback } = startAutoRefresh()

    vi.advanceTimersByTime(3 * INTERVAL)
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('skips ticks while the tab is hidden', () => {
    const { callback } = startAutoRefresh()

    setDocumentHidden(true)
    vi.advanceTimersByTime(3 * INTERVAL)
    expect(callback).not.toHaveBeenCalled()
  })

  it('catches up when a tab comes back after a full interval', () => {
    const { callback } = startAutoRefresh()

    setDocumentHidden(true)
    vi.advanceTimersByTime(1.5 * INTERVAL)
    becomeVisible()
    expect(callback).toHaveBeenCalledOnce()
  })

  it('does not catch up when the tab was hidden only briefly', () => {
    const { callback } = startAutoRefresh()

    vi.advanceTimersByTime(INTERVAL / 2)
    becomeVisible()
    expect(callback).not.toHaveBeenCalled()
  })

  it('stops when its scope is disposed', () => {
    const { callback, stop } = startAutoRefresh()

    stop()
    vi.advanceTimersByTime(5 * INTERVAL)
    becomeVisible()
    expect(callback).not.toHaveBeenCalled()
  })
})
