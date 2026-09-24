<script setup lang="ts">
import { CloudArrowDownIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'

import WeatherIcon from './WeatherIcon.vue'
import type { DailySummary } from '@/domain/types'
import { formatChance, formatTemperature } from '@/utils/format'
import { formatWeekday } from '@/utils/time'

const props = defineProps<{
  days: DailySummary[]
  timezoneOffset: number
  /** City-local YYYY-MM-DD of today. */
  todayKey: string
}>()

// Every bar shares the period's scale, so days compare at a glance.
const range = computed(() => {
  const min = Math.min(...props.days.map((day) => day.min))
  const max = Math.max(...props.days.map((day) => day.max))
  return { min, span: max - min || 1 }
})

const rows = computed(() =>
  props.days.map((day) => ({
    ...day,
    label: day.date === props.todayKey ? 'Hoje' : formatWeekday(day.time, props.timezoneOffset),
    bar: {
      left: `${(((day.min - range.value.min) / range.value.span) * 100).toFixed(1)}%`,
      width: `${(((day.max - day.min) / range.value.span) * 100).toFixed(1)}%`,
    },
  })),
)
</script>

<template>
  <section
    aria-labelledby="daily-title"
    class="animate-enter rounded-[28px] bg-surface-container p-5 [animation-delay:300ms] sm:p-6 lg:col-span-8"
  >
    <h2 id="daily-title" class="text-xl font-normal sm:text-[22px]">
      Próximos {{ days.length }} dias
    </h2>
    <ul class="mt-3 divide-y divide-outline-variant">
      <li
        v-for="day in rows"
        :key="day.date"
        class="grid grid-cols-[2.75rem_1.75rem_2.25rem_1fr] items-center gap-2 py-3 sm:grid-cols-[7rem_2rem_4rem_1fr] sm:gap-3"
      >
        <span class="font-medium">{{ day.label }}</span>
        <WeatherIcon :condition="day.condition" class="size-7" />
        <span
          class="flex items-center gap-0.5 text-sm"
          :class="day.precipitationChance >= 0.3 ? 'text-primary' : 'text-on-surface-variant'"
          :aria-label="`Chance de chuva ${formatChance(day.precipitationChance)}`"
        >
          <CloudArrowDownIcon class="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
          {{ formatChance(day.precipitationChance) }}
        </span>
        <div class="tabular flex items-center gap-1.5 text-sm sm:gap-3">
          <span class="w-6 text-right text-on-surface-variant sm:w-7">
            <span class="sr-only">Mínima</span>{{ formatTemperature(day.min) }}
          </span>
          <div class="relative h-2 flex-1 rounded-full bg-secondary-container" aria-hidden="true">
            <div
              data-testid="range-bar"
              class="absolute h-full rounded-full bg-linear-to-r from-primary to-tertiary"
              :style="day.bar"
            ></div>
          </div>
          <span class="w-6 font-medium sm:w-7">
            <span class="sr-only">Máxima</span>{{ formatTemperature(day.max) }}
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>
