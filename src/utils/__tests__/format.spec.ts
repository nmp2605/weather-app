import { describe, expect, it } from 'vitest'

import {
  capitalize,
  countryName,
  dewPoint,
  formatChance,
  formatNumber,
  formatTemperature,
  windDirection,
} from '../format'

describe('formatTemperature', () => {
  it('rounds to whole degrees', () => {
    expect(formatTemperature(23.4)).toBe('23°')
    expect(formatTemperature(23.5)).toBe('24°')
    expect(formatTemperature(-3.6)).toBe('-4°')
  })

  it('never shows a negative zero', () => {
    expect(formatTemperature(-0.4)).toBe('0°')
  })
})

describe('formatNumber / formatChance', () => {
  it('uses Brazilian separators', () => {
    expect(formatNumber(1016)).toBe('1.016')
    expect(formatNumber(9.87, 1)).toBe('9,9')
  })

  it('formats probabilities as percentages', () => {
    expect(formatChance(0.7)).toBe('70%')
    expect(formatChance(0)).toBe('0%')
  })
})

describe('countryName', () => {
  it('translates ISO codes to Portuguese', () => {
    expect(countryName('BR')).toBe('Brasil')
    expect(countryName('uy')).toBe('Uruguai')
  })

  it('returns empty or invalid codes as they are', () => {
    expect(countryName('')).toBe('')
    expect(countryName('not-a-code')).toBe('not-a-code')
  })
})

describe('capitalize', () => {
  it('uppercases the first letter only', () => {
    expect(capitalize('céu limpo')).toBe('Céu limpo')
    expect(capitalize('')).toBe('')
  })
})

describe('windDirection', () => {
  it.each([
    [0, 'N', 'norte'],
    [45, 'NE', 'nordeste'],
    [90, 'L', 'leste'],
    [200, 'S', 'sul'],
    [225, 'SO', 'sudoeste'],
    [270, 'O', 'oeste'],
    [338, 'N', 'norte'],
    [315, 'NO', 'noroeste'],
    [-45, 'NO', 'noroeste'],
    [405, 'NE', 'nordeste'],
  ] as const)('%i° is %s', (degrees, short, long) => {
    expect(windDirection(degrees)).toEqual({ short, long })
  })
})

describe('dewPoint', () => {
  it('matches the Magnus approximation', () => {
    expect(dewPoint(23, 68)).toBeCloseTo(16.8, 1)
    expect(dewPoint(20, 100)).toBeCloseTo(20, 5)
  })

  it('clamps impossible humidity values', () => {
    expect(Number.isFinite(dewPoint(20, 0))).toBe(true)
  })
})
