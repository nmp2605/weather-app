import { GEOLOCATION_MAX_AGE_MS, GEOLOCATION_TIMEOUT_MS } from '@/config/constants'
import type { Coordinates } from '@/domain/types'

export type GeolocationErrorKind = 'unsupported' | 'denied' | 'unavailable' | 'timeout'

export class GeolocationError extends Error {
  readonly kind: GeolocationErrorKind

  constructor(kind: GeolocationErrorKind, options?: { cause?: unknown }) {
    super(`Geolocation failed: ${kind}`, options)
    this.name = 'GeolocationError'
    this.kind = kind
  }
}

const KIND_BY_CODE: Readonly<Record<number, GeolocationErrorKind>> = {
  1: 'denied',
  2: 'unavailable',
  3: 'timeout',
}

export type GeolocationPermission = PermissionState | 'unsupported'

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

export async function getPermissionState(): Promise<GeolocationPermission> {
  if (typeof navigator === 'undefined' || !('permissions' in navigator)) return 'unsupported'
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    return status.state
  } catch {
    return 'unsupported'
  }
}

export function getCurrentPosition(timeoutMs = GEOLOCATION_TIMEOUT_MS): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new GeolocationError('unsupported'))
      return
    }

    const timer = setTimeout(() => reject(new GeolocationError('timeout')), timeoutMs)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer)
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude })
      },
      (error) => {
        clearTimeout(timer)
        reject(new GeolocationError(KIND_BY_CODE[error.code] ?? 'unavailable', { cause: error }))
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: GEOLOCATION_MAX_AGE_MS },
    )
  })
}
