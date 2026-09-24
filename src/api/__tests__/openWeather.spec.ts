import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OPENWEATHER_BASE_URL, http } from '../client'
import { WeatherApiError } from '../errors'
import { fetchCurrentWeather, fetchForecast, reverseGeocode, searchCities } from '../openWeather'
import { makeCurrent, makeForecast, makeGeo } from '@/__tests__/fixtures/owm'

const coords = { lat: -23.55, lon: -46.63 }
let mock: MockAdapter

beforeEach(() => {
  vi.stubEnv('VITE_OPENWEATHER_API_KEY', ' test-key ')
  mock = new MockAdapter(http)
})

afterEach(() => mock.restore())

describe('OpenWeatherMap client', () => {
  it('targets the OpenWeatherMap host with a timeout', () => {
    expect(http.defaults.baseURL).toBe(OPENWEATHER_BASE_URL)
    expect(http.defaults.timeout).toBe(10_000)
  })

  it('requests current weather in Celsius and Portuguese with the trimmed key', async () => {
    const body = makeCurrent()
    mock.onGet('/data/2.5/weather').reply(200, body)

    await expect(fetchCurrentWeather(coords)).resolves.toEqual(body)
    expect(mock.history.get[0]?.params).toEqual({
      lat: coords.lat,
      lon: coords.lon,
      units: 'metric',
      lang: 'pt_br',
      appid: 'test-key',
    })
  })

  it('requests the 5-day forecast', async () => {
    const body = makeForecast(2)
    mock.onGet('/data/2.5/forecast').reply(200, body)

    await expect(fetchForecast(coords)).resolves.toEqual(body)
    expect(mock.history.get[0]?.params).toMatchObject({ units: 'metric', lang: 'pt_br' })
  })

  it('searches cities by name with a result limit', async () => {
    mock.onGet('/geo/1.0/direct').reply(200, [makeGeo()])

    await expect(searchCities('Flori', 5)).resolves.toHaveLength(1)
    expect(mock.history.get[0]?.params).toEqual({ q: 'Flori', limit: 5, appid: 'test-key' })
  })

  it('reverse geocodes to the first match, or undefined when nothing is found', async () => {
    mock
      .onGet('/geo/1.0/reverse')
      .replyOnce(200, [makeGeo()])
      .onGet('/geo/1.0/reverse')
      .replyOnce(200, [])

    await expect(reverseGeocode(coords)).resolves.toMatchObject({ name: 'Florianopolis' })
    await expect(reverseGeocode(coords)).resolves.toBeUndefined()
    expect(mock.history.get[0]?.params).toMatchObject({ limit: 1 })
  })

  it.each([
    [401, 'unauthorized'],
    [404, 'not-found'],
    [429, 'rate-limit'],
    [500, 'unknown'],
  ] as const)('maps HTTP %i to a "%s" error', async (status, kind) => {
    mock.onGet('/data/2.5/weather').reply(status)

    const error = await fetchCurrentWeather(coords).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(WeatherApiError)
    expect(error).toMatchObject({ kind })
  })

  it('maps connection failures to a "network" error', async () => {
    mock.onGet('/data/2.5/forecast').networkError()

    await expect(fetchForecast(coords)).rejects.toMatchObject({ kind: 'network' })
  })

  it('rethrows aborted requests untouched so callers can ignore them', async () => {
    mock.onGet('/geo/1.0/direct').reply(200, [])
    const controller = new AbortController()
    controller.abort()

    const error = await searchCities('Rio', 5, controller.signal).catch((caught: unknown) => caught)
    expect(error).not.toBeInstanceOf(WeatherApiError)
    expect(error).toMatchObject({ name: 'CanceledError' })
  })
})
