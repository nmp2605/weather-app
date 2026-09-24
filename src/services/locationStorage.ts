import { LAST_LOCATION_STORAGE_KEY } from '@/config/constants'
import type { Location } from '@/domain/types'

function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

type Candidate = Record<string, unknown>

function isRecord(value: unknown): value is Candidate {
  return typeof value === 'object' && value !== null
}

function hasNames({ name, country, state }: Candidate): boolean {
  return (
    typeof name === 'string' &&
    typeof country === 'string' &&
    ['undefined', 'string'].includes(typeof state)
  )
}

function hasCoordinates({ lat, lon }: Candidate): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon)
}

function isLocation(value: unknown): value is Location {
  return isRecord(value) && hasNames(value) && hasCoordinates(value)
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

export function saveLocation(location: Location): boolean {
  const target = storage()
  if (!target) return false
  try {
    target.setItem(LAST_LOCATION_STORAGE_KEY, JSON.stringify(location))
    return true
  } catch {
    return false
  }
}
