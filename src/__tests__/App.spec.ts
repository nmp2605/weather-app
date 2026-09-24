import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SAO_PAULO, makeGeo, makeReport } from './fixtures/owm'
import { setDocumentHidden } from './helpers/browser'
import { WeatherApiError } from '@/api/errors'
import App from '@/App.vue'
import { AUTO_REFRESH_INTERVAL_MS, SEARCH_DEBOUNCE_MS } from '@/config/constants'
import { GEOLOCATION_ERROR_MESSAGES, MESSAGES, WEATHER_ERROR_CONTENT } from '@/config/messages'
import { toLocation } from '@/domain/mappers'
import { GeolocationError, getCurrentPosition } from '@/services/geolocation'
import { resolveInitialLocation } from '@/services/initialLocation'
import { findCities, getWeatherReport } from '@/services/weatherService'

vi.mock('@/services/initialLocation')
vi.mock('@/services/weatherService')
vi.mock('@/services/locationStorage')
vi.mock('@/services/geolocation', { spy: true })

const report = makeReport()
const here = { lat: -22.9, lon: -43.2 }

beforeEach(() => {
  vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'test-key')
  vi.mocked(resolveInitialLocation).mockResolvedValue({
    request: { coords: SAO_PAULO, location: SAO_PAULO },
    source: 'saved',
  })
  vi.mocked(getWeatherReport).mockResolvedValue(report)
})

async function mountApp() {
  const wrapper = mount(App, { attachTo: document.body })
  await flushPromises()
  return wrapper
}

describe('App', () => {
  it('asks for an API key when none is configured', async () => {
    vi.stubEnv('VITE_OPENWEATHER_API_KEY', '')
    const wrapper = await mountApp()

    expect(wrapper.text()).toContain('Configure a chave da OpenWeatherMap')
    expect(wrapper.find('input[role="combobox"]').exists()).toBe(false)
    expect(resolveInitialLocation).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('shows the locating state while choosing the first city', async () => {
    vi.mocked(resolveInitialLocation).mockReturnValue(new Promise(() => undefined))
    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.get('[aria-busy="true"] [role="status"]').text()).toBe('Localizando você…')
    wrapper.unmount()
  })

  it('renders the dashboard for the initial city', async () => {
    const wrapper = await mountApp()

    expect(getWeatherReport).toHaveBeenCalledWith(
      { coords: SAO_PAULO, location: SAO_PAULO },
      expect.any(AbortSignal),
    )
    for (const heading of ['São Paulo, Brasil', 'Próximas 24 horas', 'Próximos 5 dias', 'Sol']) {
      expect(wrapper.text()).toContain(heading)
    }
    expect(wrapper.text()).not.toContain('Sua localização')
    wrapper.unmount()
  })

  it('flags the browser location and shows fallback notices', async () => {
    vi.mocked(resolveInitialLocation).mockResolvedValue({
      request: { coords: here },
      source: 'geolocation',
      notice: MESSAGES.locationFallback,
    })
    const wrapper = await mountApp()

    expect(wrapper.text()).toContain('Sua localização')
    expect(wrapper.text()).toContain(MESSAGES.locationFallback)

    await wrapper.get('button[aria-label="Fechar aviso"]').trigger('click')
    expect(wrapper.text()).not.toContain(MESSAGES.locationFallback)
    wrapper.unmount()
  })

  it('shows the error state and retries', async () => {
    vi.mocked(getWeatherReport)
      .mockRejectedValueOnce(new WeatherApiError('unauthorized'))
      .mockResolvedValueOnce(report)
    const wrapper = await mountApp()

    expect(wrapper.get('[role="alert"]').text()).toContain(WEATHER_ERROR_CONTENT.unauthorized.title)
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(getWeatherReport).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('loads a city picked in the search', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const florianopolis = toLocation(makeGeo())
    vi.mocked(findCities).mockResolvedValue([florianopolis])
    vi.mocked(getWeatherReport)
      .mockResolvedValueOnce(report)
      .mockResolvedValueOnce(makeReport(florianopolis))
    const wrapper = await mountApp()

    const input = wrapper.get('input[role="combobox"]')
    await input.trigger('focus')
    await input.setValue('Flori')
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    await flushPromises()
    await wrapper.get('[role="option"]').trigger('click')
    await flushPromises()

    expect(getWeatherReport).toHaveBeenLastCalledWith(
      { coords: florianopolis, location: florianopolis },
      expect.any(AbortSignal),
    )
    expect(wrapper.text()).toContain('Florianópolis, Santa Catarina, Brasil')
    wrapper.unmount()
  })

  it('switches to the browser location on request', async () => {
    vi.mocked(getCurrentPosition).mockResolvedValue(here)
    const wrapper = await mountApp()

    await wrapper.get('button[aria-label="Usar minha localização"]').trigger('click')
    await flushPromises()

    expect(getCurrentPosition).toHaveBeenCalledWith(20_000)
    expect(getWeatherReport).toHaveBeenLastCalledWith({ coords: here }, expect.any(AbortSignal))
    expect(wrapper.text()).toContain('Sua localização')
    wrapper.unmount()
  })

  it.each([
    [new GeolocationError('denied'), GEOLOCATION_ERROR_MESSAGES.denied],
    [new Error('weird'), GEOLOCATION_ERROR_MESSAGES.unavailable],
  ])('explains why the location could not be used', async (error, message) => {
    vi.mocked(getCurrentPosition).mockRejectedValue(error)
    const wrapper = await mountApp()

    await wrapper.get('button[aria-label="Usar minha localização"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain(message)
    expect(wrapper.find('button[aria-label="Usar minha localização"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('refreshes on demand and in the background, keeping data when a refresh fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    setDocumentHidden(false)
    vi.mocked(getWeatherReport)
      .mockResolvedValueOnce(report)
      .mockResolvedValueOnce(report)
      .mockRejectedValueOnce(new WeatherApiError('network'))
    const wrapper = await mountApp()

    await wrapper.get('button[aria-label="Atualizar"]').trigger('click')
    await flushPromises()
    expect(getWeatherReport).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL_MS)
    await flushPromises()

    expect(getWeatherReport).toHaveBeenCalledTimes(3)
    expect(wrapper.text()).toContain(MESSAGES.refreshFailed)
    expect(wrapper.text()).toContain('Próximas 24 horas')
    wrapper.unmount()
  })

  it('skips background refreshes while nothing is loaded', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    setDocumentHidden(false)
    vi.mocked(getWeatherReport).mockRejectedValue(new WeatherApiError('network'))
    const wrapper = await mountApp()

    vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL_MS)
    await flushPromises()
    expect(getWeatherReport).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
