import { describe, expect, it } from 'vitest'

import { arcPoint, daylightProgress } from '../sun'

describe('daylightProgress', () => {
  it('is the elapsed share of daylight', () => {
    expect(daylightProgress(150, 100, 200)).toBe(0.5)
    expect(daylightProgress(100, 100, 200)).toBe(0)
    expect(daylightProgress(200, 100, 200)).toBe(1)
  })

  it('is null at night or with inconsistent input', () => {
    expect(daylightProgress(50, 100, 200)).toBeNull()
    expect(daylightProgress(250, 100, 200)).toBeNull()
    expect(daylightProgress(150, 200, 100)).toBeNull()
  })
})

describe('arcPoint', () => {
  it('walks the half-circle from the left to the right horizon', () => {
    expect(arcPoint(0)).toEqual({ x: 10, y: 100 })
    expect(arcPoint(0.5)).toEqual({ x: 100, y: 10 })
    expect(arcPoint(1)).toEqual({ x: 190, y: 100 })
  })
})
