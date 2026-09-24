import { onScopeDispose, ref } from 'vue'

import { CLOCK_TICK_MS } from '@/config/constants'

export function useNow(tickMs = CLOCK_TICK_MS) {
  const now = ref(Math.floor(Date.now() / 1000))
  const timer = setInterval(() => {
    now.value = Math.floor(Date.now() / 1000)
  }, tickMs)
  onScopeDispose(() => clearInterval(timer))
  return now
}
