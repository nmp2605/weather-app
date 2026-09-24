import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppSnackbar from '../AppSnackbar.vue'

beforeEach(() => {
  vi.useFakeTimers()
})

describe('AppSnackbar', () => {
  it('stays empty without a message', () => {
    const wrapper = mount(AppSnackbar, { props: { message: null } })
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toBe('')
  })

  it('auto-dismisses after the duration', () => {
    const wrapper = mount(AppSnackbar, { props: { message: 'Olá', duration: 1_000 } })
    expect(wrapper.text()).toContain('Olá')

    vi.advanceTimersByTime(999)
    expect(wrapper.emitted('dismiss')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('restarts the timer for a new message and can be closed', async () => {
    const wrapper = mount(AppSnackbar, { props: { message: 'Um', duration: 1_000 } })
    vi.advanceTimersByTime(800)
    await wrapper.setProps({ message: 'Dois' })
    vi.advanceTimersByTime(800)
    expect(wrapper.emitted('dismiss')).toBeUndefined()

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('clears its timer on unmount', () => {
    const wrapper = mount(AppSnackbar, { props: { message: 'Tchau', duration: 1_000 } })
    wrapper.unmount()
    vi.advanceTimersByTime(2_000)
    expect(wrapper.emitted('dismiss')).toBeUndefined()
  })
})
