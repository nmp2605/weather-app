<script setup lang="ts">
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ViewfinderCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { computed, ref, useId, useTemplateRef, watch } from 'vue'

import { useCitySearch } from '@/composables/useCitySearch'
import type { Location } from '@/domain/types'
import { countryName } from '@/utils/format'

withDefaults(defineProps<{ locating?: boolean }>(), { locating: false })
const emit = defineEmits<{ select: [location: Location]; locate: [] }>()

const { query, results, status, reset } = useCitySearch()

const input = useTemplateRef<HTMLInputElement>('input')
const isOpen = ref(false)
const activeIndex = ref(-1)

const baseId = useId()
const listboxId = `${baseId}-listbox`
const optionId = (index: number) => `${baseId}-option-${index}`

const showPanel = computed(() => isOpen.value && status.value !== 'idle')
const hasOptions = computed(() => status.value === 'success' && results.value.length > 0)
const activeDescendant = computed(() =>
  showPanel.value && hasOptions.value && activeIndex.value >= 0
    ? optionId(activeIndex.value)
    : undefined,
)

watch(results, (list) => {
  activeIndex.value = list.length > 0 ? 0 : -1
})

function region(location: Location): string {
  return [location.state, countryName(location.country)].filter(Boolean).join(', ')
}

function choose(location: Location) {
  emit('select', location)
  reset()
  isOpen.value = false
  input.value?.blur()
}

function move(step: number) {
  const count = results.value.length
  if (count === 0) return
  isOpen.value = true
  activeIndex.value = (activeIndex.value + step + count) % count
}

function onEnter(event: KeyboardEvent) {
  const location = results.value[activeIndex.value]
  if (!showPanel.value || !location) return
  event.preventDefault()
  choose(location)
}

function onEscape() {
  if (isOpen.value) isOpen.value = false
  else reset()
}

function clear() {
  reset()
  input.value?.focus()
}

function onFocusOut(event: FocusEvent) {
  const container = event.currentTarget as HTMLElement
  if (!container.contains(event.relatedTarget as Node | null)) isOpen.value = false
}
</script>

<template>
  <div class="relative w-full md:max-w-md" @focusout="onFocusOut">
    <label :for="`${baseId}-input`" class="sr-only">Buscar cidade</label>
    <div
      class="flex h-14 items-center gap-1 rounded-full bg-surface-high pr-1 pl-4 transition-shadow focus-within:shadow-elevation-2"
    >
      <MagnifyingGlassIcon class="size-6 shrink-0 text-on-surface" aria-hidden="true" />
      <input
        :id="`${baseId}-input`"
        ref="input"
        v-model="query"
        type="text"
        role="combobox"
        autocomplete="off"
        enterkeyhint="search"
        spellcheck="false"
        placeholder="Buscar cidade"
        aria-autocomplete="list"
        :aria-expanded="showPanel"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendant"
        class="h-full min-w-0 flex-1 cursor-text bg-transparent px-2 text-base text-on-surface placeholder:text-on-surface-variant focus:outline-none"
        @focus="isOpen = true"
        @input="isOpen = true"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter="onEnter"
        @keydown.esc="onEscape"
      />
      <button
        v-if="query"
        type="button"
        aria-label="Limpar busca"
        class="state-layer focus-ring grid size-12 shrink-0 place-items-center rounded-full text-on-surface-variant"
        @click="clear"
      >
        <XMarkIcon class="size-6" aria-hidden="true" />
      </button>
      <button
        type="button"
        :aria-label="locating ? 'Obtendo sua localização' : 'Usar minha localização'"
        :title="locating ? 'Obtendo sua localização' : 'Usar minha localização'"
        :disabled="locating"
        :aria-busy="locating"
        class="state-layer focus-ring grid size-12 shrink-0 place-items-center rounded-full text-on-surface-variant enabled:cursor-pointer"
        @click="emit('locate')"
      >
        <ViewfinderCircleIcon
          class="size-6"
          :class="{ 'animate-pulse text-primary': locating }"
          aria-hidden="true"
        />
      </button>
    </div>

    <div
      v-show="showPanel"
      class="absolute inset-x-0 top-[calc(100%+4px)] z-40 overflow-hidden rounded-[28px] bg-surface-high py-2 shadow-elevation-3"
    >
      <ul :id="listboxId" role="listbox" aria-label="Cidades encontradas" @mousedown.prevent>
        <li
          v-for="(location, index) in hasOptions ? results : []"
          :id="optionId(index)"
          :key="`${location.lat},${location.lon}`"
          role="option"
          :aria-selected="index === activeIndex"
          class="state-layer flex items-center gap-4 px-4 py-2 text-on-surface"
          :class="{ 'bg-secondary-container/60': index === activeIndex }"
          @click="choose(location)"
          @mousemove="activeIndex = index"
        >
          <MapPinIcon class="size-6 shrink-0 text-on-surface-variant" aria-hidden="true" />
          <div class="min-w-0">
            <p class="truncate text-base">{{ location.name }}</p>
            <p class="truncate text-sm text-on-surface-variant">{{ region(location) }}</p>
          </div>
        </li>
      </ul>
      <p v-if="status === 'loading'" class="px-4 py-3 text-sm text-on-surface-variant">
        Buscando cidades…
      </p>
      <p v-else-if="status === 'error'" class="px-4 py-3 text-sm text-error">
        Não foi possível buscar cidades. Tente novamente.
      </p>
      <p
        v-else-if="status === 'success' && !hasOptions"
        class="px-4 py-3 text-sm text-on-surface-variant"
      >
        Nenhuma cidade encontrada para “{{ query.trim() }}”.
      </p>
    </div>
  </div>
</template>
