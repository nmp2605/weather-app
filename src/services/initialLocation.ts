import {
  getCurrentPosition,
  getPermissionState,
  isGeolocationSupported,
  type GeolocationPermission,
} from './geolocation'
import { loadSavedLocation } from './locationStorage'
import { DEFAULT_LOCATION } from '@/config/constants'
import { MESSAGES } from '@/config/messages'
import type { LocationRequest, LocationSource } from '@/domain/types'

export interface InitialLocation {
  request: LocationRequest
  source: LocationSource
  notice?: string
}

async function fromGeolocation(): Promise<InitialLocation | null> {
  try {
    const coords = await getCurrentPosition()
    return { request: { coords }, source: 'geolocation' }
  } catch {
    return null
  }
}

function fromSavedLocation(): InitialLocation | null {
  const saved = loadSavedLocation()
  return saved ? { request: { coords: saved, location: saved }, source: 'saved' } : null
}

function fromDefaultLocation(): InitialLocation {
  return {
    request: { coords: DEFAULT_LOCATION, location: { ...DEFAULT_LOCATION } },
    source: 'default',
    notice: MESSAGES.locationFallback,
  }
}

function canPrompt(permission: GeolocationPermission): boolean {
  return (permission === 'prompt' || permission === 'unsupported') && isGeolocationSupported()
}

export async function resolveInitialLocation(): Promise<InitialLocation> {
  const permission = await getPermissionState()

  return (
    (permission === 'granted' ? await fromGeolocation() : null) ??
    fromSavedLocation() ??
    (canPrompt(permission) ? await fromGeolocation() : null) ??
    fromDefaultLocation()
  )
}
