import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as geolocation from '../geolocation'
import { resolveInitialLocation } from '../initialLocation'
import * as storage from '../locationStorage'
import { makeGeo } from '@/__tests__/fixtures/owm'
import { DEFAULT_LOCATION } from '@/config/constants'
import { MESSAGES } from '@/config/messages'
import { toLocation } from '@/domain/mappers'

vi.mock('../geolocation', { spy: true })
vi.mock('../locationStorage', { spy: true })

const here = { lat: -22.9, lon: -43.2 }
const saved = toLocation(makeGeo())

beforeEach(() => {
  vi.mocked(geolocation.isGeolocationSupported).mockReturnValue(true)
  vi.mocked(storage.loadSavedLocation).mockReturnValue(null)
})

describe('resolveInitialLocation', () => {
  it('uses the browser location when permission was already granted', async () => {
    vi.mocked(geolocation.getPermissionState).mockResolvedValue('granted')
    vi.mocked(geolocation.getCurrentPosition).mockResolvedValue(here)
    vi.mocked(storage.loadSavedLocation).mockReturnValue(saved)

    await expect(resolveInitialLocation()).resolves.toEqual({
      request: { coords: here },
      source: 'geolocation',
    })
  })

  it('falls back to the saved city when a granted lookup fails', async () => {
    vi.mocked(geolocation.getPermissionState).mockResolvedValue('granted')
    vi.mocked(geolocation.getCurrentPosition).mockRejectedValue(
      new geolocation.GeolocationError('unavailable'),
    )
    vi.mocked(storage.loadSavedLocation).mockReturnValue(saved)

    await expect(resolveInitialLocation()).resolves.toEqual({
      request: { coords: saved, location: saved },
      source: 'saved',
    })
  })

  it('prefers the saved city over prompting for permission', async () => {
    vi.mocked(geolocation.getPermissionState).mockResolvedValue('prompt')
    vi.mocked(storage.loadSavedLocation).mockReturnValue(saved)

    const result = await resolveInitialLocation()
    expect(result.source).toBe('saved')
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled()
  })

  it.each(['prompt', 'unsupported'] as const)(
    'asks for the location on a first visit (permission "%s")',
    async (permission) => {
      vi.mocked(geolocation.getPermissionState).mockResolvedValue(permission)
      vi.mocked(geolocation.getCurrentPosition).mockResolvedValue(here)

      await expect(resolveInitialLocation()).resolves.toMatchObject({ source: 'geolocation' })
    },
  )

  it('defaults to Goiânia', () => {
    expect(DEFAULT_LOCATION).toMatchObject({ name: 'Goiânia', state: 'Goiás', country: 'BR' })
    expect(MESSAGES.locationFallback).toBe(
      'Não foi possível usar sua localização. Mostrando Goiânia.',
    )
  })

  it('shows the default city with a notice when the prompt fails', async () => {
    vi.mocked(geolocation.getPermissionState).mockResolvedValue('prompt')
    vi.mocked(geolocation.getCurrentPosition).mockRejectedValue(
      new geolocation.GeolocationError('denied'),
    )

    await expect(resolveInitialLocation()).resolves.toEqual({
      request: { coords: DEFAULT_LOCATION, location: { ...DEFAULT_LOCATION } },
      source: 'default',
      notice: MESSAGES.locationFallback,
    })
  })

  it('does not prompt again when permission was denied', async () => {
    vi.mocked(geolocation.getPermissionState).mockResolvedValue('denied')

    await expect(resolveInitialLocation()).resolves.toMatchObject({ source: 'default' })
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled()
  })

  it('does not prompt when the browser has no geolocation', async () => {
    vi.mocked(geolocation.getPermissionState).mockResolvedValue('unsupported')
    vi.mocked(geolocation.isGeolocationSupported).mockReturnValue(false)

    await expect(resolveInitialLocation()).resolves.toMatchObject({ source: 'default' })
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled()
  })
})
