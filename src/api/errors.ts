import { isAxiosError, isCancel } from 'axios'

export type WeatherErrorKind = 'unauthorized' | 'not-found' | 'rate-limit' | 'network' | 'unknown'

const KIND_BY_STATUS: Readonly<Record<number, WeatherErrorKind>> = {
  401: 'unauthorized',
  404: 'not-found',
  429: 'rate-limit',
}

export class WeatherApiError extends Error {
  readonly kind: WeatherErrorKind

  constructor(kind: WeatherErrorKind, options?: { cause?: unknown }) {
    super(`OpenWeatherMap request failed: ${kind}`, options)
    this.name = 'WeatherApiError'
    this.kind = kind
  }
}

/** True for requests aborted on purpose (a newer search or location replaced them). */
export function isAbortError(error: unknown): boolean {
  return isCancel(error) || (error instanceof DOMException && error.name === 'AbortError')
}

export function toWeatherApiError(error: unknown): WeatherApiError {
  if (error instanceof WeatherApiError) return error

  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status === undefined) return new WeatherApiError('network', { cause: error })
    return new WeatherApiError(KIND_BY_STATUS[status] ?? 'unknown', { cause: error })
  }

  return new WeatherApiError('unknown', { cause: error })
}
