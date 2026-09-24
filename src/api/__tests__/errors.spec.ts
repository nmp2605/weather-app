import { AxiosError, CanceledError } from 'axios'
import { describe, expect, it } from 'vitest'

import { WeatherApiError, isAbortError, toWeatherApiError } from '../errors'

describe('WeatherApiError', () => {
  it('keeps the kind and cause', () => {
    const cause = new Error('boom')
    const error = new WeatherApiError('network', { cause })

    expect(error.name).toBe('WeatherApiError')
    expect(error.kind).toBe('network')
    expect(error.cause).toBe(cause)
    expect(error.message).toContain('network')
  })
})

describe('toWeatherApiError', () => {
  it('returns WeatherApiError instances unchanged', () => {
    const error = new WeatherApiError('rate-limit')
    expect(toWeatherApiError(error)).toBe(error)
  })

  it('treats axios errors without a response as network failures', () => {
    expect(toWeatherApiError(new AxiosError('offline')).kind).toBe('network')
  })

  it('treats anything else as unknown', () => {
    expect(toWeatherApiError(new TypeError('bad')).kind).toBe('unknown')
    expect(toWeatherApiError('nope').kind).toBe('unknown')
  })
})

describe('isAbortError', () => {
  it('recognizes axios cancellations and DOM aborts', () => {
    expect(isAbortError(new CanceledError())).toBe(true)
    expect(isAbortError(new DOMException('stop', 'AbortError'))).toBe(true)
  })

  it('rejects other errors', () => {
    expect(isAbortError(new DOMException('x', 'NotFoundError'))).toBe(false)
    expect(isAbortError(new Error('x'))).toBe(false)
  })
})
