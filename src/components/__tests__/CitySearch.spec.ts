import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CitySearch from '../CitySearch.vue'
import { SAO_PAULO, makeGeo } from '@/__tests__/fixtures/owm'
import { toLocation } from '@/domain/mappers'
import { findCities } from '@/services/weatherService'

vi.mock('@/services/weatherService')

const florianopolis = toLocation(makeGeo())
const floriano = toLocation(
  makeGeo({ name: 'Floriano', local_names: undefined, state: 'Piauí', lat: -6.77, lon: -43.02 }),
)
const noState = { ...SAO_PAULO, state: undefined, name: 'Montevidéu', country: 'UY', lat: -34.9 }

beforeEach(() => {
  vi.useFakeTimers()
})

async function search(wrapper: VueWrapper, value: string) {
  const input = wrapper.get('input')
  await input.trigger('focus')
  await input.setValue(value)
  vi.runAllTimers()
  await flushPromises()
  return input
}

function mountSearch() {
  return mount(CitySearch, { attachTo: document.body })
}

describe('CitySearch', () => {
  it('is an accessible combobox that starts closed', () => {
    const wrapper = mountSearch()
    const input = wrapper.get('input')

    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-expanded')).toBe('false')
    expect(wrapper.get(`#${input.attributes('aria-controls')}`).attributes('role')).toBe('listbox')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.classes()).toContain('cursor-text')
    wrapper.unmount()
  })

  it('lists matching cities with their region', async () => {
    vi.mocked(findCities).mockResolvedValue([florianopolis, floriano, noState])
    const wrapper = mountSearch()
    const input = await search(wrapper, 'Flori')

    const options = wrapper.findAll('[role="option"]')
    expect(input.attributes('aria-expanded')).toBe('true')
    expect(options.map((option) => option.text())).toEqual([
      'FlorianópolisSanta Catarina, Brasil',
      'FlorianoPiauí, Brasil',
      'MontevidéuUruguai',
    ])
    expect(options[0]?.attributes('aria-selected')).toBe('true')
    expect(input.attributes('aria-activedescendant')).toBe(options[0]?.attributes('id'))
    wrapper.unmount()
  })

  it('moves the active option with the arrow keys and selects with Enter', async () => {
    vi.mocked(findCities).mockResolvedValue([florianopolis, floriano])
    const wrapper = mountSearch()
    const input = await search(wrapper, 'Flori')

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.findAll('[role="option"]')[1]?.attributes('aria-selected')).toBe('true')
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.findAll('[role="option"]')[0]?.attributes('aria-selected')).toBe('true')
    await input.trigger('keydown', { key: 'ArrowUp' })
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('select')).toEqual([[floriano]])
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(input.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('selects with the mouse and tracks hover', async () => {
    vi.mocked(findCities).mockResolvedValue([florianopolis, floriano])
    const wrapper = mountSearch()
    await search(wrapper, 'Flori')

    const second = wrapper.findAll('[role="option"]')[1]
    await second?.trigger('mousemove')
    expect(second?.attributes('aria-selected')).toBe('true')
    await second?.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[floriano]])
    wrapper.unmount()
  })

  it('ignores Enter and arrows when there is nothing to pick', async () => {
    vi.mocked(findCities).mockResolvedValue([])
    const wrapper = mountSearch()
    const input = await search(wrapper, 'Xyzzy')

    expect(wrapper.text()).toContain('Nenhuma cidade encontrada para “Xyzzy”.')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
    wrapper.unmount()
  })

  it('shows loading and error messages', async () => {
    vi.mocked(findCities).mockRejectedValue(new Error('offline'))
    const wrapper = mountSearch()
    const input = wrapper.get('input')

    await input.trigger('focus')
    await input.setValue('Rio')
    expect(wrapper.text()).toContain('Buscando cidades…')

    vi.runAllTimers()
    await flushPromises()
    expect(wrapper.text()).toContain('Não foi possível buscar cidades.')
    wrapper.unmount()
  })

  it('closes with Escape, then clears on a second Escape', async () => {
    vi.mocked(findCities).mockResolvedValue([florianopolis])
    const wrapper = mountSearch()
    const input = await search(wrapper, 'Flori')

    await input.trigger('keydown', { key: 'Escape' })
    expect(input.attributes('aria-expanded')).toBe('false')
    expect((input.element as HTMLInputElement).value).toBe('Flori')

    await input.trigger('keydown', { key: 'Escape' })
    expect((input.element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('clears the query from the clear button and keeps focus in the field', async () => {
    vi.mocked(findCities).mockResolvedValue([florianopolis])
    const wrapper = mountSearch()
    const input = await search(wrapper, 'Flori')

    await wrapper.get('button[aria-label="Limpar busca"]').trigger('click')
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.find('button[aria-label="Limpar busca"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('closes when focus leaves the component but not when it moves inside', async () => {
    vi.mocked(findCities).mockResolvedValue([florianopolis])
    const wrapper = mountSearch()
    const input = await search(wrapper, 'Flori')
    const clear = wrapper.get('button[aria-label="Limpar busca"]').element

    await input.trigger('focusout', { relatedTarget: clear })
    expect(input.attributes('aria-expanded')).toBe('true')

    await input.trigger('focusout', { relatedTarget: null })
    expect(input.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('asks for the browser location and reflects progress', async () => {
    const wrapper = mountSearch()
    const button = wrapper.get('button[aria-label="Usar minha localização"]')
    expect(button.classes()).toContain('enabled:cursor-pointer')
    await button.trigger('click')
    expect(wrapper.emitted('locate')).toHaveLength(1)

    await wrapper.setProps({ locating: true })
    const locate = wrapper.get('button[aria-label="Obtendo sua localização"]')
    expect(locate.attributes('disabled')).toBeDefined()
    expect(locate.attributes('aria-busy')).toBe('true')
    wrapper.unmount()
  })
})
