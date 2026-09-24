<script setup lang="ts">
import {
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  MapPinIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'
import { ViewfinderCircleIcon } from '@heroicons/vue/24/solid'
import { computed } from 'vue'

import WeatherIcon from './WeatherIcon.vue'
import type { CurrentWeather, DailySummary, Location } from '@/domain/types'
import { capitalize, countryName, formatTemperature } from '@/utils/format'
import { formatClock } from '@/utils/time'

const props = defineProps<{
  location: Location
  current: CurrentWeather
  today?: DailySummary
  timezoneOffset: number
  now: number
  isCurrentLocation: boolean
  refreshing: boolean
}>()
defineEmits<{ refresh: [] }>()

const placeLabel = computed(() => {
  const { name, state, country } = props.location
  const parts = [name, state === name ? undefined : state, countryName(country)]
  return parts.filter(Boolean).join(', ')
})

const temperature = computed(() => Math.round(props.current.temperature) || 0)
const localTime = computed(() => formatClock(props.now, props.timezoneOffset))
const updatedAt = computed(() => formatClock(props.current.observedAt, props.timezoneOffset))
</script>

<template>
  <section
    aria-labelledby="current-title"
    class="relative card-hover animate-enter overflow-hidden rounded-[28px] bg-primary-container p-5 text-on-primary-container sm:p-8 lg:col-span-8"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 id="current-title" class="flex items-center gap-1 text-sm font-medium">
          <MapPinIcon class="size-[18px] shrink-0" aria-hidden="true" />
          <span class="truncate">{{ placeLabel }}</span>
        </h2>
        <p class="mt-1 text-sm opacity-80">
          Hora local {{ localTime }} · Atualizado às {{ updatedAt }}
        </p>
      </div>
      <button
        type="button"
        :aria-label="refreshing ? 'Atualizando' : 'Atualizar'"
        :title="refreshing ? 'Atualizando' : 'Atualizar'"
        :disabled="refreshing"
        class="state-layer focus-ring -mt-2 -mr-2 grid size-10 shrink-0 place-items-center rounded-full enabled:cursor-pointer"
        @click="$emit('refresh')"
      >
        <ArrowPathIcon class="size-6" :class="{ 'animate-spin': refreshing }" aria-hidden="true" />
      </button>
    </div>

    <div class="mt-4 flex items-end justify-between gap-4 sm:mt-6">
      <div>
        <p class="flex items-start" :aria-label="`${temperature} graus Celsius`">
          <span
            class="tabular text-[6.5rem] leading-none font-light tracking-tight sm:text-[9rem]"
            aria-hidden="true"
            >{{ temperature }}</span
          >
          <span class="mt-3 text-3xl font-light sm:mt-4 sm:text-4xl" aria-hidden="true">°C</span>
        </p>
        <p class="mt-1 text-xl font-normal sm:text-2xl">
          {{ capitalize(current.condition.description) }}
        </p>
      </div>
      <WeatherIcon
        :condition="current.condition"
        :toned="false"
        decorative
        class="size-20 shrink-0 text-primary sm:size-28"
      />
    </div>

    <ul class="mt-6 flex flex-wrap gap-2 text-sm font-medium">
      <li
        v-if="isCurrentLocation"
        class="flex h-8 items-center gap-2 rounded-lg bg-primary px-3 text-on-primary"
      >
        <ViewfinderCircleIcon class="size-[18px]" aria-hidden="true" />Sua localização
      </li>
      <li class="flex h-8 items-center gap-2 rounded-lg border border-on-primary-container/25 px-3">
        <UserIcon class="size-[18px]" aria-hidden="true" />Sensação
        {{ formatTemperature(current.feelsLike) }}
      </li>
      <template v-if="today">
        <li
          class="flex h-8 items-center gap-2 rounded-lg border border-on-primary-container/25 px-3"
        >
          <ArrowDownIcon class="size-[18px]" aria-hidden="true" />Mín
          {{ formatTemperature(today.min) }}
        </li>
        <li
          class="flex h-8 items-center gap-2 rounded-lg border border-on-primary-container/25 px-3"
        >
          <ArrowUpIcon class="size-[18px]" aria-hidden="true" />Máx
          {{ formatTemperature(today.max) }}
        </li>
      </template>
    </ul>
  </section>
</template>
