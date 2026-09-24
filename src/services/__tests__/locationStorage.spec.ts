import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadSavedLocation, saveLocation } from '../locationStorage'
import { SAO_PAULO } from '@/__tests__/fixtures/owm'
import { LAST_LOCATION_STORAGE_KEY } from '@/config/constants'

const original = Object.getOwnPropertyDescriptor(window, 'localStorage')

afterEach(() => {
  if (original) Object.defineProperty(window, 'localStorage', original)
})

describe('location storage', () => {
  it('round-trips the last location', () => {
    expect(saveLocation(SAO_PAULO)).toBe(true)
    expect(loadSavedLocation()).toEqual(SAO_PAULO)
  })

  it('returns null when nothing was saved', () => {
    expect(loadSavedLocation()).toBeNull()
  })

  it.each([
    ['invalid JSON', '{nope'],
    ['a non-object', '"São Paulo"'],
    ['null', 'null'],
    ['missing coordinates', JSON.stringify({ name: 'X', country: 'BR' })],
    ['a non-string state', JSON.stringify({ ...SAO_PAULO, state: 42 })],
  ])('ignores %s', (_, raw) => {
    window.localStorage.setItem(LAST_LOCATION_STORAGE_KEY, raw)
    expect(loadSavedLocation()).toBeNull()
  })

  it('accepts a location without a state', () => {
    const withoutState = { ...SAO_PAULO, state: undefined }
    saveLocation(withoutState)
    expect(loadSavedLocation()).not.toHaveProperty('state')
  })

  it('survives storage that throws on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(saveLocation(SAO_PAULO)).toBe(false)
  })

  it('survives storage that cannot even be accessed', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('blocked', 'SecurityError')
      },
    })
    expect(loadSavedLocation()).toBeNull()
    expect(saveLocation(SAO_PAULO)).toBe(false)
  })
})
