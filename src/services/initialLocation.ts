import { getCurrentPosition, getPermissionState, isGeolocationSupported } from './geolocation'
import { loadSavedLocation } from './locationStorage'
import { DEFAULT_LOCATION } from '@/config/constants'
import { MESSAGES } from '@/config/messages'
import type { Coordinates, LocationRequest, LocationSource } from '@/domain/types'

export interface InitialLocation {
  request: LocationRequest
  source: LocationSource
  /** Set when the app had to fall back to the default city. */
  notice?: string
}

async function tryLocate(): Promise<Coordinates | null> {
  try {
    return await getCurrentPosition()
  } catch {
    return null
  }
}

/**
 * Chooses the first city to show:
 * 1. the browser location, when permission was already granted;
 * 2. the last city the user viewed;
 * 3. the browser location, asking for permission (first visit);
 * 4. the default city.
 */
export async function resolveInitialLocation(): Promise<InitialLocation> {
  const permission = await getPermissionState()

  if (permission === 'granted') {
    const coords = await tryLocate()
    if (coords) return { request: { coords }, source: 'geolocation' }
  }

  const saved = loadSavedLocation()
  if (saved) return { request: { coords: saved, location: saved }, source: 'saved' }

  const canPrompt = permission === 'prompt' || permission === 'unsupported'
  if (canPrompt && isGeolocationSupported()) {
    const coords = await tryLocate()
    if (coords) return { request: { coords }, source: 'geolocation' }
  }

  return {
    request: { coords: DEFAULT_LOCATION, location: { ...DEFAULT_LOCATION } },
    source: 'default',
    notice: MESSAGES.locationFallback,
  }
}
