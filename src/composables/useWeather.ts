import { onScopeDispose, ref, shallowRef } from 'vue'

import { isAbortError, toWeatherApiError, type WeatherApiError } from '@/api/errors'
import type { LocationRequest, WeatherReport } from '@/domain/types'
import { saveLocation } from '@/services/locationStorage'
import { getWeatherReport } from '@/services/weatherService'

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error'

export function useWeather() {
  const report = shallowRef<WeatherReport | null>(null)
  const status = ref<WeatherStatus>('idle')
  const error = shallowRef<WeatherApiError | null>(null)
  const isRefreshing = ref(false)

  let controller: AbortController | null = null
  let lastRequest: LocationRequest | null = null

  /**
   * Loads weather for a place. A newer call aborts the previous one, so a slow
   * response can never overwrite a more recent choice. With `silent`, the current
   * report stays on screen while the new one loads.
   */
  async function load(request: LocationRequest, { silent = false } = {}): Promise<void> {
    controller?.abort()
    const current = new AbortController()
    controller = current
    lastRequest = request

    const keepReport = silent && report.value !== null
    if (keepReport) isRefreshing.value = true
    else status.value = 'loading'
    error.value = null

    try {
      const result = await getWeatherReport(request, current.signal)
      report.value = result
      status.value = 'success'
      saveLocation(result.location)
    } catch (caught) {
      if (isAbortError(caught)) return
      error.value = toWeatherApiError(caught)
      if (!keepReport) status.value = 'error'
    } finally {
      if (controller === current) isRefreshing.value = false
    }
  }

  /** Reloads the last place without hiding the data already shown. */
  function refresh(): Promise<void> {
    return lastRequest ? load(lastRequest, { silent: true }) : Promise.resolve()
  }

  function retry(): Promise<void> {
    return lastRequest ? load(lastRequest) : Promise.resolve()
  }

  onScopeDispose(() => controller?.abort())

  return { report, status, error, isRefreshing, load, refresh, retry }
}
