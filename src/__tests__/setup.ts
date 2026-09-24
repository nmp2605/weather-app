import { afterEach, vi } from 'vitest'

import { clearBrowserStubs } from './helpers/browser'

afterEach(() => {
  vi.useRealTimers()
  clearBrowserStubs()
  window.localStorage.clear()
})
