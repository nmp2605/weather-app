import { describe, expect, it } from 'vitest'

import { toCondition, toConditionKind } from '../conditions'

describe('toConditionKind', () => {
  it.each([
    [200, 'thunderstorm'],
    [232, 'thunderstorm'],
    [300, 'drizzle'],
    [500, 'rain'],
    [531, 'rain'],
    [600, 'snow'],
    [701, 'mist'],
    [781, 'mist'],
    [800, 'clear'],
    [801, 'few-clouds'],
    [802, 'clouds'],
    [804, 'clouds'],
  ] as const)('maps %i to %s', (id, kind) => {
    expect(toConditionKind(id)).toBe(kind)
  })
})

describe('toCondition', () => {
  it('reads day and night from the icon code', () => {
    expect(toCondition({ id: 800, main: 'Clear', description: 'céu limpo', icon: '01n' })).toEqual({
      kind: 'clear',
      description: 'céu limpo',
      isNight: true,
    })
    expect(toCondition({ id: 500, main: 'Rain', description: 'chuva', icon: '10d' }).isNight).toBe(
      false,
    )
  })

  it('falls back to a neutral condition when the API sends none', () => {
    expect(toCondition(undefined)).toEqual({ kind: 'clouds', description: '', isNight: false })
  })
})
