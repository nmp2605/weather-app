import { onScopeDispose, ref, shallowRef, watch } from 'vue'

import { isAbortError } from '@/api/errors'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from '@/config/constants'
import type { Location } from '@/domain/types'
import { findCities } from '@/services/weatherService'

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

export function useCitySearch(debounceMs = SEARCH_DEBOUNCE_MS) {
  const query = ref('')
  const results = shallowRef<Location[]>([])
  const status = ref<SearchStatus>('idle')

  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | null = null

  function cancelPending() {
    clearTimeout(timer)
    controller?.abort()
    controller = null
  }

  async function run(term: string) {
    const current = new AbortController()
    controller = current
    try {
      results.value = await findCities(term, current.signal)
      status.value = 'success'
    } catch (error) {
      if (isAbortError(error)) return
      results.value = []
      status.value = 'error'
    }
  }

  watch(query, (value) => {
    cancelPending()
    const term = value.trim()
    if (term.length < SEARCH_MIN_LENGTH) {
      results.value = []
      status.value = 'idle'
      return
    }
    status.value = 'loading'
    timer = setTimeout(() => void run(term), debounceMs)
  })

  function reset() {
    cancelPending()
    query.value = ''
  }

  onScopeDispose(cancelPending)

  return { query, results, status, reset }
}
