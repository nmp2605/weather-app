import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ErrorState from '../ErrorState.vue'
import LinearProgress from '../LinearProgress.vue'
import LoadingState from '../LoadingState.vue'
import MissingApiKey from '../MissingApiKey.vue'
import { OPENWEATHER_SIGN_UP_URL } from '@/config/constants'
import { WEATHER_ERROR_CONTENT } from '@/config/messages'

describe('LinearProgress', () => {
  it('is an accessible progress bar', () => {
    const wrapper = mount(LinearProgress, { props: { label: 'Atualizando' } })
    expect(wrapper.attributes('role')).toBe('progressbar')
    expect(wrapper.attributes('aria-label')).toBe('Atualizando')
  })
})

describe('LoadingState', () => {
  it('announces the message and renders skeletons', () => {
    const wrapper = mount(LoadingState, { props: { message: 'Localizando você…' } })
    expect(wrapper.get('[role="status"]').text()).toBe('Localizando você…')
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(4)
  })
})

describe('ErrorState', () => {
  it.each(Object.keys(WEATHER_ERROR_CONTENT) as (keyof typeof WEATHER_ERROR_CONTENT)[])(
    'explains "%s" errors',
    (kind) => {
      const wrapper = mount(ErrorState, { props: { kind } })
      expect(wrapper.attributes('role')).toBe('alert')
      expect(wrapper.get('h2').text()).toBe(WEATHER_ERROR_CONTENT[kind].title)
    },
  )

  it('emits retry', async () => {
    const wrapper = mount(ErrorState, { props: { kind: 'network' } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

describe('MissingApiKey', () => {
  it('explains how to configure the key', () => {
    const wrapper = mount(MissingApiKey)
    expect(wrapper.text()).toContain('VITE_OPENWEATHER_API_KEY')
    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe(OPENWEATHER_SIGN_UP_URL)
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })
})
