import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppHeader from '../AppHeader.vue'

describe('AppHeader', () => {
  it('shows the title, the date and the slot', () => {
    const today = new Date(2026, 8, 23, 12)
    const wrapper = mount(AppHeader, {
      props: { today },
      slots: { default: '<input aria-label="Buscar cidade" />' },
    })

    expect(wrapper.get('h1').text()).toBe('Boletim do Tempo')
    expect(wrapper.get('time').text()).toBe('Qua, 23 de setembro')
    expect(wrapper.get('time').attributes('datetime')).toBe(today.toISOString().slice(0, 10))
    expect(wrapper.find('input').exists()).toBe(true)
  })
})
