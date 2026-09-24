<script setup lang="ts">
import { ClockIcon, CloudArrowDownIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'

import WeatherIcon from './WeatherIcon.vue'
import type { HourlyPoint } from '@/domain/types'
import { formatChance, formatTemperature } from '@/utils/format'
import { formatHourLabel } from '@/utils/time'

const props = defineProps<{ points: HourlyPoint[]; timezoneOffset: number }>()

// Chart geometry (SVG viewBox 0 0 800 160): temperatures span y = 130 (min) to 30 (max).
const WIDTH = 800
const HEIGHT = 160
const BASELINE = 130
const AMPLITUDE = 100

const chart = computed(() => {
  const temps = props.points.map((point) => point.temperature)
  const min = Math.min(...temps)
  const span = Math.max(...temps) - min || 1
  const step = WIDTH / props.points.length

  const coords = props.points.map((point, index) => ({
    x: step * (index + 0.5),
    y: BASELINE - ((point.temperature - min) / span) * AMPLITUDE,
  }))
  const line = coords
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  const first = coords[0]
  const last = coords.at(-1)
  const area =
    first && last
      ? `${line} L${last.x.toFixed(1)} ${HEIGHT} L${first.x.toFixed(1)} ${HEIGHT} Z`
      : ''

  return {
    line,
    area,
    // Percentages keep HTML labels aligned with the stretched (non-uniform) SVG.
    markers: coords.map(({ x, y }) => ({
      left: `${(x / WIDTH) * 100}%`,
      top: `${(y / HEIGHT) * 100}%`,
    })),
  }
})

const columns = computed(() => ({
  gridTemplateColumns: `repeat(${props.points.length}, minmax(0, 1fr))`,
}))

function label(point: HourlyPoint, index: number) {
  return index === 0 ? 'Agora' : formatHourLabel(point.time, props.timezoneOffset)
}

function chanceClass(point: HourlyPoint, index: number) {
  if (index === 0) return ''
  return point.precipitationChance > 0 ? 'text-primary' : 'text-on-surface-variant'
}
</script>

<template>
  <section
    aria-labelledby="hourly-title"
    class="card-hover animate-enter rounded-[28px] bg-surface-low p-5 shadow-elevation-1 [animation-delay:260ms] sm:p-6 lg:col-span-12"
  >
    <div class="flex items-center justify-between gap-3">
      <h2 id="hourly-title" class="text-xl font-normal sm:text-[22px]">Próximas 24 horas</h2>
      <span
        class="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-secondary-container px-3 text-sm font-medium text-on-secondary-container"
      >
        <ClockIcon class="size-[18px]" aria-hidden="true" />
        <span class="sm:hidden">3 h</span><span class="hidden sm:inline">A cada 3 h</span>
      </span>
    </div>

    <!-- Below 640px the chart scrolls sideways so every column stays legible. -->
    <div class="-mx-5 mt-4 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
      <div class="min-w-[600px]">
        <div class="relative mt-6 h-24" aria-hidden="true">
          <svg
            :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
            preserveAspectRatio="none"
            class="absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <linearGradient id="hourly-curve-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stop-color="var(--md-primary)" stop-opacity=".22" />
                <stop offset="1" stop-color="var(--md-primary)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path :d="chart.area" fill="url(#hourly-curve-fill)" />
            <path
              data-testid="hourly-line"
              :d="chart.line"
              fill="none"
              stroke="var(--md-primary)"
              stroke-width="3"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <div class="tabular absolute inset-0 text-sm font-medium">
            <template v-for="(marker, index) in chart.markers" :key="index">
              <span class="absolute -translate-x-1/2 -translate-y-[170%]" :style="marker">
                {{ formatTemperature(points[index]?.temperature ?? 0) }}
              </span>
              <span
                class="absolute box-content size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface-low bg-primary"
                :style="marker"
              ></span>
            </template>
          </div>
        </div>

        <ol class="mt-3 grid gap-2 text-center" :style="columns">
          <li
            v-for="(point, index) in points"
            :key="point.time"
            class="flex flex-col items-center gap-2 rounded-2xl py-3"
            :class="index === 0 ? 'bg-secondary-container text-on-secondary-container' : ''"
          >
            <span
              class="text-xs"
              :class="index === 0 ? 'font-medium' : 'text-on-surface-variant'"
              >{{ label(point, index) }}</span
            >
            <WeatherIcon :condition="point.condition" class="size-7" />
            <span class="sr-only">{{ formatTemperature(point.temperature) }}, chance de chuva</span>
            <span class="flex items-center gap-0.5 text-xs" :class="chanceClass(point, index)">
              <CloudArrowDownIcon class="size-3.5" aria-hidden="true" />
              {{ formatChance(point.precipitationChance) }}
            </span>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
