import { describe, expect, it, vi } from 'vitest'

import {
  GeolocationError,
  getCurrentPosition,
  getPermissionState,
  isGeolocationSupported,
} from '../geolocation'
import {
  positionAt,
  positionError,
  stubGeolocation,
  stubPermission,
} from '@/__tests__/helpers/browser'

describe('isGeolocationSupported', () => {
  it('detects the API', () => {
    expect(isGeolocationSupported()).toBe(false)
    stubGeolocation(vi.fn())
    expect(isGeolocationSupported()).toBe(true)
  })
})

describe('getPermissionState', () => {
  it('reads the permission without prompting', async () => {
    stubPermission('granted')
    await expect(getPermissionState()).resolves.toBe('granted')
  })

  it('reports "unsupported" without the Permissions API or when the query fails', async () => {
    await expect(getPermissionState()).resolves.toBe('unsupported')
    stubPermission(new TypeError('geolocation not queryable'))
    await expect(getPermissionState()).resolves.toBe('unsupported')
  })
})

describe('getCurrentPosition', () => {
  it('rejects when the browser has no geolocation', async () => {
    await expect(getCurrentPosition()).rejects.toMatchObject({ kind: 'unsupported' })
  })

  it('resolves coordinates using a low-accuracy, cached position', async () => {
    const spy = vi.fn<Parameters<typeof stubGeolocation>[0]>((success) =>
      success(positionAt(-27.6, -48.5)),
    )
    stubGeolocation(spy)

    await expect(getCurrentPosition(5_000)).resolves.toEqual({ lat: -27.6, lon: -48.5 })
    expect(spy.mock.calls[0]?.[2]).toEqual({
      enableHighAccuracy: false,
      timeout: 5_000,
      maximumAge: 600_000,
    })
  })

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
    [99, 'unavailable'],
  ] as const)('maps error code %i to "%s"', async (code, kind) => {
    stubGeolocation((_, failure) => failure(positionError(code)))

    const error = await getCurrentPosition().catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(GeolocationError)
    expect(error).toMatchObject({ kind, name: 'GeolocationError' })
  })

  it('gives up while the permission prompt is left unanswered', async () => {
    vi.useFakeTimers()
    stubGeolocation(() => undefined)

    const pending = getCurrentPosition(8_000)
    vi.advanceTimersByTime(8_000)
    await expect(pending).rejects.toMatchObject({ kind: 'timeout' })
  })
})
