import { flushPromises } from '@vue/test-utils'
import { CanceledError } from 'axios'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCitySearch } from '../useCitySearch'
import { SAO_PAULO } from '@/__tests__/fixtures/owm'
import { withScope } from '@/__tests__/helpers/scope'
import { findCities } from '@/services/weatherService'

vi.mock('@/services/weatherService')

beforeEach(() => {
  vi.useFakeTimers()
})

async function type(query: { value: string }, value: string) {
  query.value = value
  await nextTick()
}

describe('useCitySearch', () => {
  it('ignores queries shorter than two characters', async () => {
    const { result } = withScope(() => useCitySearch(300))

    await type(result.query, ' a ')
    vi.advanceTimersByTime(300)

    expect(result.status.value).toBe('idle')
    expect(findCities).not.toHaveBeenCalled()
  })

  it('debounces typing and searches the trimmed term', async () => {
    vi.mocked(findCities).mockResolvedValue([SAO_PAULO])
    const { result } = withScope(() => useCitySearch(300))

    await type(result.query, 'Sã')
    await type(result.query, ' São ')
    expect(result.status.value).toBe('loading')
    vi.advanceTimersByTime(299)
    expect(findCities).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(findCities).toHaveBeenCalledExactlyOnceWith('São', expect.any(AbortSignal))
    expect(result.results.value).toEqual([SAO_PAULO])
    expect(result.status.value).toBe('success')
  })

  it('reports failures', async () => {
    vi.mocked(findCities).mockRejectedValue(new Error('offline'))
    const { result } = withScope(() => useCitySearch(0))

    await type(result.query, 'Rio')
    vi.runAllTimers()
    await flushPromises()

    expect(result.status.value).toBe('error')
    expect(result.results.value).toEqual([])
  })

  it('aborts an in-flight search when the query changes', async () => {
    let firstSignal: AbortSignal | undefined
    vi.mocked(findCities)
      .mockImplementationOnce((_, signal) => {
        firstSignal = signal
        return Promise.reject(new CanceledError())
      })
      .mockResolvedValueOnce([SAO_PAULO])
    const { result } = withScope(() => useCitySearch(0))

    await type(result.query, 'Sa')
    vi.runAllTimers()
    await type(result.query, 'São')
    expect(firstSignal?.aborted).toBe(true)
    vi.runAllTimers()
    await flushPromises()

    expect(result.status.value).toBe('success')
    expect(result.results.value).toEqual([SAO_PAULO])
  })

  it('resets the query, results and pending work', async () => {
    vi.mocked(findCities).mockResolvedValue([SAO_PAULO])
    const { result } = withScope(() => useCitySearch(300))

    await type(result.query, 'Recife')
    result.reset()
    await nextTick()
    vi.runAllTimers()

    expect(result.query.value).toBe('')
    expect(result.status.value).toBe('idle')
    expect(findCities).not.toHaveBeenCalled()
  })

  it('cancels a pending search when disposed', async () => {
    const { result, stop } = withScope(() => useCitySearch(300))

    await type(result.query, 'Manaus')
    stop()
    vi.runAllTimers()
    expect(findCities).not.toHaveBeenCalled()
  })
})
