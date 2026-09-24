import { LAST_LOCATION_STORAGE_KEY } from '@/config/constants'
import type { Location } from '@/domain/types'

function storage(): Storage | undefined {
  // Access itself can throw (privacy mode, blocked site data).
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function isLocation(value: unknown): value is Location {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.country === 'string' &&
    Number.isFinite(candidate.lat) &&
    Number.isFinite(candidate.lon) &&
    (candidate.state === undefined || typeof candidate.state === 'string')
  )
}

export function loadSavedLocation(): Location | null {
  try {
    const raw = storage()?.getItem(LAST_LOCATION_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isLocation(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveLocation(location: Location): void {
  try {
    storage()?.setItem(LAST_LOCATION_STORAGE_KEY, JSON.stringify(location))
  } catch {
    // Storage full or blocked: remembering the city is a convenience, not a requirement.
  }
}
