import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CurrentWeatherCard from '../CurrentWeatherCard.vue'
import DailyForecast from '../DailyForecast.vue'
import HourlyForecast from '../HourlyForecast.vue'
import SunCard from '../SunCard.vue'
import WeatherIndicators from '../WeatherIndicators.vue'
import {
  OBSERVED_AT,
  SAO_PAULO,
  SAO_PAULO_OFFSET,
  SUNRISE,
  SUNSET,
  makeReport,
} from '@/__tests__/fixtures/owm'
import type { HourlyPoint } from '@/domain/types'

const report = makeReport()
const now = OBSERVED_AT + 8 * 60 // 15:20 local

describe('CurrentWeatherCard', () => {
  const baseProps = {
    location: SAO_PAULO,
    current: report.current,
    today: report.daily[0],
    timezoneOffset: SAO_PAULO_OFFSET,
    now,
    isCurrentLocation: false,
    refreshing: false,
  }

  it('shows the place, local time, temperature and chips', () => {
    const wrapper = mount(CurrentWeatherCard, { props: baseProps })
    const text = wrapper.text()

    // The state is omitted when it repeats the city name.
    expect(wrapper.get('h2').text()).toBe('São Paulo, Brasil')
    expect(text).toContain('Hora local 15:20 · Atualizado às 15:12')
    expect(wrapper.get('[aria-label="23 graus Celsius"]').text()).toContain('23')
    expect(text).toContain('Nublado')
    expect(text).toContain('Sensação 24°')
    expect(text).toContain('Mín 14°')
    expect(text).toContain('Máx 23°')
    expect(text).not.toContain('Sua localização')
  })

  it('includes a distinct state and flags the browser location', () => {
    const wrapper = mount(CurrentWeatherCard, {
      props: {
        ...baseProps,
        location: { ...SAO_PAULO, name: 'Campinas' },
        isCurrentLocation: true,
        today: undefined,
      },
    })

    expect(wrapper.get('h2').text()).toBe('Campinas, São Paulo, Brasil')
    expect(wrapper.text()).toContain('Sua localização')
    expect(wrapper.text()).not.toContain('Mín')
  })

  it('emits refresh and reflects the refreshing state', async () => {
    const wrapper = mount(CurrentWeatherCard, { props: baseProps })
    expect(wrapper.get('button').classes()).toContain('enabled:cursor-pointer')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)

    await wrapper.setProps({ refreshing: true })
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-label')).toBe('Atualizando')
    expect(button.find('svg').classes()).toContain('animate-spin')
  })

  it('shows 0 instead of -0 for sub-zero rounding', () => {
    const wrapper = mount(CurrentWeatherCard, {
      props: { ...baseProps, current: { ...report.current, temperature: -0.3 } },
    })
    expect(wrapper.find('[aria-label="0 graus Celsius"]').exists()).toBe(true)
  })
})

describe('WeatherIndicators', () => {
  it('renders every indicator with Brazilian formatting', () => {
    const wrapper = mount(WeatherIndicators, { props: { current: report.current } })
    const text = wrapper.text()

    expect(text).toContain('68%')
    expect(text).toContain('Ponto de orvalho 17°')
    expect(text).toContain('km/h · NE')
    expect(text).toContain('1.016')
    expect(text).toContain('10')
    expect(wrapper.find('[aria-label="Vento de nordeste"]').exists()).toBe(true)
    expect(wrapper.get('[aria-label="Vento de nordeste"] svg').attributes('style')).toContain(
      'rotate(225deg)',
    )
    expect(wrapper.get('[data-testid="humidity-ring"]').attributes('stroke-dasharray')).toBe(
      '179.4 263.9',
    )
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('75')
  })

  it('shows a dash when visibility is unknown', () => {
    const wrapper = mount(WeatherIndicators, {
      props: { current: { ...report.current, visibilityKm: null, windDeg: 350 } },
    })
    expect(wrapper.text()).toContain('—')
    expect(wrapper.get('[aria-label="Vento de norte"] svg').attributes('style')).toContain(
      'rotate(170deg)',
    )
  })
})

describe('HourlyForecast', () => {
  it('labels the first tile "Agora" and the rest by local hour', () => {
    const wrapper = mount(HourlyForecast, {
      props: { points: report.hourly, timezoneOffset: SAO_PAULO_OFFSET },
    })
    const tiles = wrapper.findAll('li')

    expect(tiles).toHaveLength(8)
    expect(tiles[0]?.text()).toContain('Agora')
    expect(tiles[1]?.text()).toContain('18h')
    expect(tiles[2]?.text()).toContain('21h')
    expect(tiles[2]?.text()).toContain('10%')
    expect(wrapper.get('ol').attributes('style')).toContain('repeat(8, minmax(0, 1fr))')
  })

  it('draws a curve from the warmest to the coldest reading', () => {
    const wrapper = mount(HourlyForecast, {
      props: { points: report.hourly, timezoneOffset: SAO_PAULO_OFFSET },
    })
    const line = wrapper.get('[data-testid="hourly-line"]').attributes('d')

    // 23.4 °C (max) sits on y=30, 15 °C (min) on the baseline y=130.
    expect(line).toMatch(/^M50\.0 30\.0 L150\.0 130\.0/)
    expect(wrapper.text()).toContain('23°')
  })

  it('handles a flat temperature series and highlights rain chances', () => {
    const points: HourlyPoint[] = report.hourly.slice(0, 2).map((point, index) => ({
      ...point,
      temperature: 20,
      precipitationChance: index === 1 ? 0.6 : 0,
    }))
    const wrapper = mount(HourlyForecast, { props: { points, timezoneOffset: SAO_PAULO_OFFSET } })

    expect(wrapper.get('[data-testid="hourly-line"]').attributes('d')).toBe(
      'M200.0 130.0 L600.0 130.0',
    )
    const chances = wrapper.findAll('li > span.flex')
    expect(chances[1]?.classes()).toContain('text-primary')
  })

  it('shows neutral chance styling when rain is unlikely', () => {
    const points = report.hourly.map((point) => ({ ...point, precipitationChance: 0 }))
    const wrapper = mount(HourlyForecast, { props: { points, timezoneOffset: SAO_PAULO_OFFSET } })
    expect(wrapper.findAll('li > span.flex')[1]?.classes()).toContain('text-on-surface-variant')
  })

  it('renders no area without points', () => {
    const wrapper = mount(HourlyForecast, { props: { points: [], timezoneOffset: 0 } })
    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})

describe('DailyForecast', () => {
  it('names today and weekdays, and scales bars to the whole period', () => {
    const wrapper = mount(DailyForecast, {
      props: { days: report.daily, timezoneOffset: SAO_PAULO_OFFSET, todayKey: '2026-09-23' },
    })
    const rows = wrapper.findAll('li')

    expect(wrapper.get('h2').text()).toBe('Próximos 5 dias')
    expect(rows.map((row) => row.find('span').text())).toEqual(['Hoje', 'Qui', 'Sex', 'Sáb', 'Dom'])
    expect(rows[1]?.text()).toContain('40%')
    // Period range is 14 °C → 23.4 °C; today spans all of it.
    expect(wrapper.get('[data-testid="range-bar"]').attributes('style')).toContain('left: 0%')
    expect(wrapper.get('[data-testid="range-bar"]').attributes('style')).toContain('width: 100%')
  })

  it('uses weekday names when today is not in the list', () => {
    const wrapper = mount(DailyForecast, {
      props: { days: report.daily, timezoneOffset: SAO_PAULO_OFFSET, todayKey: '2026-09-22' },
    })
    expect(wrapper.find('li span').text()).toBe('Qua')
  })

  it('copes with identical temperatures', () => {
    const flat = report.daily
      .slice(0, 1)
      .map((day) => ({ ...day, min: 20, max: 20, precipitationChance: 0 }))
    const wrapper = mount(DailyForecast, {
      props: { days: flat, timezoneOffset: SAO_PAULO_OFFSET, todayKey: '' },
    })
    expect(wrapper.get('[data-testid="range-bar"]').attributes('style')).toContain('width: 0%')
    expect(wrapper.get('li > span.flex').classes()).toContain('text-on-surface-variant')
  })
})

describe('SunCard', () => {
  it('places the sun along its daily arc', () => {
    const wrapper = mount(SunCard, {
      props: { sunrise: SUNRISE, sunset: SUNSET, now, timezoneOffset: SAO_PAULO_OFFSET },
    })

    expect(wrapper.text()).toContain('05:52')
    expect(wrapper.text()).toContain('18:01')
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toBe(
      'O sol já percorreu 78% do trajeto do dia',
    )
    expect(wrapper.get('[data-testid="sun-progress"]').attributes('d')).toBe(
      'M10 100 A90 90 0 0 1 169.2 42.4',
    )
  })

  it('hides the sun at night', () => {
    const wrapper = mount(SunCard, {
      props: {
        sunrise: SUNRISE,
        sunset: SUNSET,
        now: SUNSET + 60,
        timezoneOffset: SAO_PAULO_OFFSET,
      },
    })
    expect(wrapper.find('[data-testid="sun-progress"]').exists()).toBe(false)
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toBe(
      'O sol está abaixo do horizonte',
    )
  })
})

describe('card hover', () => {
  it('applies the hover elevation to every dashboard card', () => {
    const cards = [
      mount(CurrentWeatherCard, {
        props: {
          location: SAO_PAULO,
          current: report.current,
          timezoneOffset: SAO_PAULO_OFFSET,
          now,
          isCurrentLocation: false,
          refreshing: false,
        },
      }).findAll('section'),
      mount(WeatherIndicators, { props: { current: report.current } }).findAll('article'),
      mount(HourlyForecast, {
        props: { points: report.hourly, timezoneOffset: SAO_PAULO_OFFSET },
      }).findAll('section'),
      mount(DailyForecast, {
        props: { days: report.daily, timezoneOffset: SAO_PAULO_OFFSET, todayKey: '' },
      }).findAll('section'),
      mount(SunCard, {
        props: { sunrise: SUNRISE, sunset: SUNSET, now, timezoneOffset: SAO_PAULO_OFFSET },
      }).findAll('section'),
    ].flat()

    expect(cards).toHaveLength(9)
    for (const card of cards) expect(card.classes()).toContain('card-hover')
  })
})
