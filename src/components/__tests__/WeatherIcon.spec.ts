import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import WeatherIcon from '../WeatherIcon.vue'
import type { Condition, ConditionKind } from '@/domain/types'

const make = (kind: ConditionKind, overrides: Partial<Condition> = {}): Condition => ({
  kind,
  description: '',
  isNight: false,
  ...overrides,
})

describe('WeatherIcon', () => {
  it('labels the icon with the capitalized API description', () => {
    const wrapper = mount(WeatherIcon, {
      props: { condition: make('rain', { description: 'chuva leve' }) },
    })

    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Chuva leve')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.classes()).toContain('text-primary')
  })

  it.each([
    ['clear', 'Céu limpo', 'text-tertiary'],
    ['few-clouds', 'Poucas nuvens', 'text-tertiary'],
    ['clouds', 'Nublado', 'text-secondary'],
    ['drizzle', 'Garoa', 'text-primary'],
    ['thunderstorm', 'Tempestade', 'text-primary'],
    ['snow', 'Neve', 'text-secondary'],
    ['mist', 'Névoa', 'text-secondary'],
  ] as const)('falls back to a Portuguese label for %s', (kind, label, tone) => {
    const wrapper = mount(WeatherIcon, { props: { condition: make(kind) } })
    expect(wrapper.attributes('aria-label')).toBe(label)
    expect(wrapper.classes()).toContain(tone)
    expect(wrapper.attributes('data-condition')).toBe(kind)
  })

  it('swaps the sun for the moon on clear nights only', () => {
    const clearNight = mount(WeatherIcon, {
      props: { condition: make('clear', { isNight: true }) },
    })
    const rainyNight = mount(WeatherIcon, { props: { condition: make('rain', { isNight: true }) } })
    const clearDay = mount(WeatherIcon, { props: { condition: make('clear') } })

    expect(clearNight.find('path').attributes('d')).not.toBe(clearDay.find('path').attributes('d'))
    expect(rainyNight.attributes('data-condition')).toBe('rain')
  })

  it('can be decorative and untoned', () => {
    const wrapper = mount(WeatherIcon, {
      props: { condition: make('clouds'), decorative: true, toned: false },
    })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.classes()).not.toContain('text-secondary')
  })
})
