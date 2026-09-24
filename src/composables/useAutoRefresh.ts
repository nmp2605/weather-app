import { onScopeDispose } from 'vue'

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
