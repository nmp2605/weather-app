import { describe, expect, it } from 'vitest'

import { buildReport, mapCurrent, mapDaily, mapHourly, toLocation } from '../mappers'
import {
  FORECAST_START,
  OBSERVED_AT,
  SAO_PAULO,
  makeCurrent,
  makeForecast,
  makeGeo,
} from '@/__tests__/fixtures/owm'

describe('toLocation', () => {
  it('prefers the Portuguese name and keeps the state', () => {
    expect(toLocation(makeGeo())).toEqual({
      name: 'Florianópolis',
      state: 'Santa Catarina',
      country: 'BR',
      lat: -27.5954,
      lon: -48.548,
    })
  })

  it('falls back to the default name and omits a missing state', () => {
    const location = toLocation(makeGeo({ local_names: undefined, state: undefined }))
    expect(location.name).toBe('Florianopolis')
    expect(location).not.toHaveProperty('state')
  })
})

describe('mapCurrent', () => {
  it('converts units and flattens the payload', () => {
    expect(mapCurrent(makeCurrent())).toEqual({
      temperature: 23.4,
      feelsLike: 24.1,
      humidity: 68,
      pressure: 1016,
      visibilityKm: 10,
      windSpeedKmh: expect.closeTo(14.04, 2) as number,
      windDeg: 45,
      cloudiness: 75,
      condition: { kind: 'clouds', description: 'nublado', isNight: false },
      observedAt: OBSERVED_AT,
      sunrise: expect.any(Number) as number,
      sunset: expect.any(Number) as number,
    })
  })

  it('reports unknown visibility as null', () => {
    expect(mapCurrent(makeCurrent({ visibility: undefined })).visibilityKm).toBeNull()
  })
})

describe('mapHourly', () => {
  it('starts with the current reading and adds the next 3-hour steps', () => {
    const points = mapHourly(makeCurrent(), makeForecast())

    expect(points).toHaveLength(8)
    expect(points[0]).toMatchObject({
      time: OBSERVED_AT,
      temperature: 23.4,
      precipitationChance: 0,
    })
    expect(points[1]).toMatchObject({ time: FORECAST_START, temperature: 15 })
    expect(points[5]?.condition.kind).toBe('rain')
  })

  it('uses a zero chance of rain when the forecast is empty', () => {
    const points = mapHourly(makeCurrent(), makeForecast(0))
    expect(points).toEqual([expect.objectContaining({ precipitationChance: 0 })])
  })
})

describe('mapDaily', () => {
  const days = mapDaily(makeCurrent(), makeForecast())

  it('groups the forecast into five local calendar days', () => {
    expect(days.map((day) => day.date)).toEqual([
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ])
  })

  it("includes the current temperature in today's range", () => {
    expect(days[0]).toMatchObject({
      min: 14,
      max: 23.4,
      precipitationChance: 0.1,
      time: FORECAST_START,
    })
  })

  it('uses the reading closest to noon and the highest chance of rain', () => {
    const noon = FORECAST_START + 6 * 3 * 3600 // index 6 → 12:00 local on the 24th
    expect(days[1]).toMatchObject({ min: 14, max: 23, precipitationChance: 0.4, time: noon })
    expect(days[1]?.condition.isNight).toBe(false)
  })
})

describe('mapDaily late at night', () => {
  it('builds today from the current reading when no forecast step is left today', () => {
    const lateNight = makeCurrent({
      dt: OBSERVED_AT - 86_400,
      main: { ...makeCurrent().main, temp: 19 },
    })
    const days = mapDaily(lateNight, makeForecast())

    expect(days).toHaveLength(5)
    expect(days[0]).toEqual({
      date: '2026-09-22',
      time: OBSERVED_AT - 86_400,
      min: 19,
      max: 25,
      condition: { kind: 'clouds', description: 'nublado', isNight: false },
      precipitationChance: 0,
    })
    expect(days[1]?.date).toBe('2026-09-23')
  })

  it('handles an empty forecast', () => {
    expect(mapDaily(makeCurrent(), makeForecast(0))).toEqual([
      expect.objectContaining({ date: '2026-09-23', min: 21, max: 25, precipitationChance: 0 }),
    ])
  })
})

describe('buildReport', () => {
  it('assembles the whole report', () => {
    const report = buildReport(SAO_PAULO, makeCurrent(), makeForecast())

    expect(report.location).toBe(SAO_PAULO)
    expect(report.timezoneOffset).toBe(-10_800)
    expect(report.hourly).toHaveLength(8)
    expect(report.daily).toHaveLength(5)
  })
})
