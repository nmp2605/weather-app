import { onScopeDispose, ref, shallowRef } from 'vue'

import { isAbortError, toWeatherApiError, type WeatherApiError } from '@/api/errors'
import type { LocationRequest, WeatherReport } from '@/domain/types'
import { saveLocation } from '@/services/locationStorage'
import { getWeatherReport } from '@/services/weatherService'

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error'

interface LoadOptions {
  silent?: boolean
}

export function useWeather() {
  const report = shallowRef<WeatherReport | null>(null)
  const status = ref<WeatherStatus>('idle')
  const error = shallowRef<WeatherApiError | null>(null)
  const isRefreshing = ref(false)

  let controller: AbortController | null = null
  let lastRequest: LocationRequest | null = null

  function startRequest(request: LocationRequest): AbortController {
    controller?.abort()
    controller = new AbortController()
    lastRequest = request
    return controller
  }

  function markPending(keepReport: boolean) {
    if (keepReport) isRefreshing.value = true
    else status.value = 'loading'
    error.value = null
  }

  function applyReport(result: WeatherReport) {
    report.value = result
    status.value = 'success'
    saveLocation(result.location)
  }

  function applyFailure(caught: unknown, keepReport: boolean) {
    if (isAbortError(caught)) return
    error.value = toWeatherApiError(caught)
    if (!keepReport) status.value = 'error'
  }

  async function load(request: LocationRequest, options: LoadOptions = {}): Promise<void> {
    const current = startRequest(request)
    const keepReport = options.silent === true && report.value !== null
    markPending(keepReport)

    try {
      applyReport(await getWeatherReport(request, current.signal))
    } catch (caught) {
      applyFailure(caught, keepReport)
    } finally {
      if (controller === current) isRefreshing.value = false
    }
  }

  function refresh(): Promise<void> {
    return lastRequest ? load(lastRequest, { silent: true }) : Promise.resolve()
  }

  function retry(): Promise<void> {
    return lastRequest ? load(lastRequest) : Promise.resolve()
  }

  onScopeDispose(() => controller?.abort())

  return { report, status, error, isRefreshing, load, refresh, retry }
}
