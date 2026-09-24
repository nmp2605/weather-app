import { describe, expect, it } from 'vitest'

import {
  formatClock,
  formatHeaderDate,
  formatHourLabel,
  formatWeekday,
  localDateKey,
  localHour,
} from '../time'
import { OBSERVED_AT, SAO_PAULO_OFFSET } from '@/__tests__/fixtures/owm'

describe('city-local time helpers', () => {
  it('formats the wall clock of the city, not of the viewer', () => {
    expect(formatClock(OBSERVED_AT, SAO_PAULO_OFFSET)).toBe('15:12')
    expect(formatClock(OBSERVED_AT, 9 * 3600)).toBe('03:12')
  })

  it('derives the local hour and date', () => {
    expect(localHour(OBSERVED_AT, SAO_PAULO_OFFSET)).toBe(15)
    expect(localDateKey(OBSERVED_AT, SAO_PAULO_OFFSET)).toBe('2026-09-23')
    expect(localDateKey(OBSERVED_AT, 9 * 3600)).toBe('2026-09-24')
  })

  it('labels hours as "18h"', () => {
    expect(formatHourLabel(OBSERVED_AT + 3 * 3600, SAO_PAULO_OFFSET)).toBe('18h')
    expect(formatHourLabel(OBSERVED_AT - 12 * 3600, SAO_PAULO_OFFSET)).toBe('03h')
  })

  it('uses short Portuguese weekdays without the trailing dot', () => {
    expect(formatWeekday(OBSERVED_AT, SAO_PAULO_OFFSET)).toBe('Qua')
    expect(formatWeekday(OBSERVED_AT + 3 * 86_400, SAO_PAULO_OFFSET)).toBe('Sáb')
  })
})

describe('formatHeaderDate', () => {
  it('reads like "Qua, 23 de setembro"', () => {
    expect(formatHeaderDate(new Date(2026, 8, 23, 12))).toBe('Qua, 23 de setembro')
  })
})
