import { flushPromises } from '@vue/test-utils'
import { CanceledError } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { useWeather } from '../useWeather'
import { SAO_PAULO, makeReport } from '@/__tests__/fixtures/owm'
import { withScope } from '@/__tests__/helpers/scope'
import { WeatherApiError } from '@/api/errors'
import type { LocationRequest, WeatherReport } from '@/domain/types'
import { saveLocation } from '@/services/locationStorage'
import { getWeatherReport } from '@/services/weatherService'

vi.mock('@/services/weatherService')
vi.mock('@/services/locationStorage')

const request: LocationRequest = { coords: SAO_PAULO, location: SAO_PAULO }

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useWeather', () => {
  it('starts idle', () => {
    const { result } = withScope(useWeather)
    expect(result.status.value).toBe('idle')
    expect(result.report.value).toBeNull()
  })

  it('loads a report, then remembers the place', async () => {
    const report = makeReport()
    vi.mocked(getWeatherReport).mockResolvedValue(report)
    const { result } = withScope(useWeather)

    const pending = result.load(request)
    expect(result.status.value).toBe('loading')
    await pending

    expect(result.status.value).toBe('success')
    expect(result.report.value).toBe(report)
    expect(saveLocation).toHaveBeenCalledWith(SAO_PAULO)
    expect(getWeatherReport).toHaveBeenCalledWith(request, expect.any(AbortSignal))
  })

  it('exposes failures as a typed error', async () => {
    vi.mocked(getWeatherReport).mockRejectedValue(new Error('boom'))
    const { result } = withScope(useWeather)

    await result.load(request)
    expect(result.status.value).toBe('error')
    expect(result.error.value?.kind).toBe('unknown')
  })

  it('lets the newest request win and aborts the older one', async () => {
    const slow = deferred<WeatherReport>()
    const newer = makeReport({ ...SAO_PAULO, name: 'Recife' })
    vi.mocked(getWeatherReport)
      .mockImplementationOnce((_, signal) => {
        signal?.addEventListener('abort', () => slow.reject(new CanceledError()))
        return slow.promise
      })
      .mockResolvedValueOnce(newer)
    const { result } = withScope(useWeather)

    const first = result.load(request)
    await result.load({ coords: SAO_PAULO })
    await first

    expect(result.report.value).toBe(newer)
    expect(result.status.value).toBe('success')
    expect(result.error.value).toBeNull()
  })

  it('refreshes silently and keeps the last report when the refresh fails', async () => {
    const report = makeReport()
    vi.mocked(getWeatherReport)
      .mockResolvedValueOnce(report)
      .mockRejectedValueOnce(new WeatherApiError('network'))
    const { result } = withScope(useWeather)
    await result.load(request)

    const refreshing = result.refresh()
    expect(result.isRefreshing.value).toBe(true)
    expect(result.status.value).toBe('success')
    await refreshing

    expect(result.isRefreshing.value).toBe(false)
    expect(result.report.value).toBe(report)
    expect(result.status.value).toBe('success')
    expect(result.error.value?.kind).toBe('network')
  })

  it('retries the last request with a full loading state', async () => {
    vi.mocked(getWeatherReport)
      .mockRejectedValueOnce(new WeatherApiError('network'))
      .mockResolvedValueOnce(makeReport())
    const { result } = withScope(useWeather)
    await result.load(request)

    const retrying = result.retry()
    expect(result.status.value).toBe('loading')
    await retrying
    expect(result.status.value).toBe('success')
    expect(getWeatherReport).toHaveBeenLastCalledWith(request, expect.any(AbortSignal))
  })

  it('does nothing on refresh or retry before the first load', async () => {
    const { result } = withScope(useWeather)
    await result.refresh()
    await result.retry()
    expect(getWeatherReport).not.toHaveBeenCalled()
  })

  it('aborts the pending request when its scope is disposed', async () => {
    let captured: AbortSignal | undefined
    vi.mocked(getWeatherReport).mockImplementation((_, signal) => {
      captured = signal
      return new Promise(() => undefined)
    })
    const { result, stop } = withScope(useWeather)

    void result.load(request)
    await flushPromises()
    stop()
    expect(captured?.aborted).toBe(true)
  })
})
