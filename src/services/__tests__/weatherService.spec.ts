import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findCities, getWeatherReport } from '../weatherService'
import { SAO_PAULO, makeCurrent, makeForecast, makeGeo } from '@/__tests__/fixtures/owm'
import * as api from '@/api/openWeather'
import { WeatherApiError } from '@/api/errors'

vi.mock('@/api/openWeather')

const coords = { lat: -27.6, lon: -48.5 }

beforeEach(() => {
  vi.mocked(api.fetchCurrentWeather).mockResolvedValue(makeCurrent({ name: 'Estação Centro' }))
  vi.mocked(api.fetchForecast).mockResolvedValue(makeForecast())
})

describe('getWeatherReport', () => {
  it('skips reverse geocoding when the place is already known', async () => {
    const signal = new AbortController().signal
    const report = await getWeatherReport({ coords: SAO_PAULO, location: SAO_PAULO }, signal)

    expect(report.location).toBe(SAO_PAULO)
    expect(api.fetchCurrentWeather).toHaveBeenCalledWith(SAO_PAULO, signal)
    expect(api.fetchForecast).toHaveBeenCalledWith(SAO_PAULO, signal)
    expect(api.reverseGeocode).not.toHaveBeenCalled()
  })

  it('names coordinates through reverse geocoding', async () => {
    vi.mocked(api.reverseGeocode).mockResolvedValue(makeGeo())

    const report = await getWeatherReport({ coords })
    expect(report.location).toMatchObject({ name: 'Florianópolis', state: 'Santa Catarina' })
  })

  it.each([
    ['finds nothing', () => vi.mocked(api.reverseGeocode).mockResolvedValue(undefined)],
    [
      'fails',
      () => vi.mocked(api.reverseGeocode).mockRejectedValue(new WeatherApiError('network')),
    ],
  ])('falls back to the station name when reverse geocoding %s', async (_, arrange) => {
    arrange()
    const report = await getWeatherReport({ coords })
    expect(report.location).toEqual({ name: 'Estação Centro', country: 'BR', ...coords })
  })

  it('tolerates a missing country code', async () => {
    vi.mocked(api.reverseGeocode).mockResolvedValue(undefined)
    vi.mocked(api.fetchCurrentWeather).mockResolvedValue(
      makeCurrent({ sys: { sunrise: 1, sunset: 2 } }),
    )

    const report = await getWeatherReport({ coords })
    expect(report.location.country).toBe('')
  })

  it('propagates weather failures', async () => {
    vi.mocked(api.fetchForecast).mockRejectedValue(new WeatherApiError('rate-limit'))
    await expect(
      getWeatherReport({ coords: SAO_PAULO, location: SAO_PAULO }),
    ).rejects.toMatchObject({ kind: 'rate-limit' })
  })
})

describe('findCities', () => {
  it('maps results and removes duplicates', async () => {
    vi.mocked(api.searchCities).mockResolvedValue([
      makeGeo(),
      makeGeo({ lat: -27.59, lon: -48.54 }), // same city, another point
      makeGeo({ name: 'Floriano', local_names: undefined, state: 'Piauí' }),
    ])

    const cities = await findCities('Flori')
    expect(cities.map((city) => city.name)).toEqual(['Florianópolis', 'Floriano'])
    expect(api.searchCities).toHaveBeenCalledWith('Flori', 5, undefined)
  })
})
