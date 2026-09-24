import { onScopeDispose } from 'vue'

/**
 * Calls `callback` every `intervalMs` while the page is visible. When a hidden tab
 * becomes visible again after a full interval, it refreshes right away.
 */
export function useAutoRefresh(callback: () => void, intervalMs: number) {
  let lastRun = Date.now()

  function run() {
    lastRun = Date.now()
    callback()
  }

  const timer = setInterval(() => {
    if (!document.hidden) run()
  }, intervalMs)

  function onVisibilityChange() {
    if (!document.hidden && Date.now() - lastRun >= intervalMs) run()
  }

  document.addEventListener('visibilitychange', onVisibilityChange)

  onScopeDispose(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
}
