<script setup lang="ts">
import { ArrowLongUpIcon } from '@heroicons/vue/24/solid'
import { BeakerIcon, CloudIcon, EyeIcon, FlagIcon, ScaleIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'

import type { CurrentWeather } from '@/domain/types'
import { dewPoint, formatNumber, formatTemperature, windDirection } from '@/utils/format'

const props = defineProps<{ current: CurrentWeather }>()

// Layout — md: humidity 2×2 plus four tiles; lg: two-column stack beside the current card.
const RING_CIRCUMFERENCE = 2 * Math.PI * 42

const humidityDash = computed(
  () =>
    `${((props.current.humidity / 100) * RING_CIRCUMFERENCE).toFixed(1)} ${RING_CIRCUMFERENCE.toFixed(1)}`,
)
const dew = computed(() =>
  formatTemperature(dewPoint(props.current.temperature, props.current.humidity)),
)
const wind = computed(() => windDirection(props.current.windDeg))
// The API reports where the wind comes from; the arrow shows where it blows to.
const windArrowRotation = computed(() => `rotate(${(props.current.windDeg + 180) % 360}deg)`)
const visibility = computed(() =>
  props.current.visibilityKm === null ? '—' : formatNumber(props.current.visibilityKm, 1),
)
</script>

<template>
  <section
    aria-label="Indicadores"
    class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:col-span-4 lg:grid-cols-2 lg:gap-6"
  >
    <article
      class="col-span-2 flex animate-enter items-center justify-between gap-4 rounded-[28px] bg-surface-container p-5 [animation-delay:60ms] md:row-span-2 lg:row-span-1"
    >
      <div>
        <h3 class="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
          <BeakerIcon class="size-5 text-primary" aria-hidden="true" />Umidade
        </h3>
        <p class="tabular mt-2 text-[2.75rem] leading-none font-normal">
          {{ current.humidity }}<span class="text-2xl text-on-surface-variant">%</span>
        </p>
        <p class="mt-2 text-sm text-on-surface-variant">Ponto de orvalho {{ dew }}</p>
      </div>
      <!-- M3 determinate circular progress indicator -->
      <svg viewBox="0 0 100 100" class="size-20 shrink-0 -rotate-90 sm:size-24" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--md-secondary-container)"
          stroke-width="8"
        />
        <circle
          data-testid="humidity-ring"
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--md-primary)"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="humidityDash"
        />
      </svg>
    </article>

    <article class="animate-enter rounded-[28px] bg-surface-container p-5 [animation-delay:100ms]">
      <h3 class="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
        <FlagIcon class="size-5 text-primary" aria-hidden="true" />Vento
      </h3>
      <div class="mt-3 flex items-center gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-full bg-secondary-container text-on-secondary-container"
          role="img"
          :aria-label="`Vento de ${wind.long}`"
          :title="`Vento de ${wind.long}`"
        >
          <ArrowLongUpIcon
            class="size-5"
            :style="{ transform: windArrowRotation }"
            aria-hidden="true"
          />
        </span>
        <div class="leading-tight">
          <p class="tabular text-2xl">{{ formatNumber(current.windSpeedKmh) }}</p>
          <p class="text-xs whitespace-nowrap text-on-surface-variant">km/h · {{ wind.short }}</p>
        </div>
      </div>
    </article>

    <article class="animate-enter rounded-[28px] bg-surface-container p-5 [animation-delay:140ms]">
      <h3 class="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
        <ScaleIcon class="size-5 text-primary" aria-hidden="true" />Pressão
      </h3>
      <p class="tabular mt-3 text-2xl">{{ formatNumber(current.pressure) }}</p>
      <p class="text-xs text-on-surface-variant">hPa</p>
    </article>

    <article class="animate-enter rounded-[28px] bg-surface-container p-5 [animation-delay:180ms]">
      <h3 class="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
        <EyeIcon class="size-5 text-primary" aria-hidden="true" />Visibilidade
      </h3>
      <p class="tabular mt-3 text-2xl">{{ visibility }}</p>
      <p class="text-xs text-on-surface-variant">km</p>
    </article>

    <article class="animate-enter rounded-[28px] bg-surface-container p-5 [animation-delay:220ms]">
      <h3 class="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
        <CloudIcon class="size-5 text-primary" aria-hidden="true" />Nuvens
      </h3>
      <p class="tabular mt-3 text-2xl">
        {{ current.cloudiness }}<span class="text-base text-on-surface-variant">%</span>
      </p>
      <!-- M3 determinate linear progress indicator -->
      <div
        class="mt-2 flex h-1 gap-1"
        role="progressbar"
        aria-label="Nebulosidade"
        :aria-valuenow="current.cloudiness"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="h-full rounded-full bg-primary"
          :style="{ width: `${current.cloudiness}%` }"
        ></div>
        <div class="h-full flex-1 rounded-full bg-secondary-container"></div>
      </div>
    </article>
  </section>
</template>
