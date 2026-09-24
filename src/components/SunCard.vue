<script setup lang="ts">
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'

import { formatChance } from '@/utils/format'
import { arcPoint, daylightProgress } from '@/utils/sun'
import { formatClock } from '@/utils/time'

const props = defineProps<{
  sunrise: number
  sunset: number
  now: number
  timezoneOffset: number
}>()

const progress = computed(() => daylightProgress(props.now, props.sunrise, props.sunset))
const sun = computed(() => (progress.value === null ? null : arcPoint(progress.value)))
const description = computed(() =>
  progress.value === null
    ? 'O sol está abaixo do horizonte'
    : `O sol já percorreu ${formatChance(progress.value)} do trajeto do dia`,
)
</script>

<template>
  <section
    aria-labelledby="sun-title"
    class="flex card-hover animate-enter flex-col rounded-[28px] bg-tertiary-container p-5 text-on-tertiary-container [animation-delay:340ms] sm:p-6 lg:col-span-4"
  >
    <h2 id="sun-title" class="text-xl font-normal sm:text-[22px]">Sol</h2>
    <div class="flex flex-1 items-center justify-center py-4">
      <svg viewBox="0 0 200 110" class="w-full max-w-[260px]" role="img" :aria-label="description">
        <path
          d="M10 100 A90 90 0 0 1 190 100"
          fill="none"
          stroke="currentColor"
          stroke-opacity=".3"
          stroke-width="3"
          stroke-dasharray="1 7"
          stroke-linecap="round"
        />
        <line
          x1="0"
          y1="100"
          x2="200"
          y2="100"
          stroke="currentColor"
          stroke-opacity=".25"
          stroke-width="1.5"
        />
        <template v-if="sun">
          <path
            data-testid="sun-progress"
            :d="`M10 100 A90 90 0 0 1 ${sun.x} ${sun.y}`"
            fill="none"
            stroke="var(--md-tertiary)"
            stroke-width="4"
            stroke-linecap="round"
          />
          <circle :cx="sun.x" :cy="sun.y" r="14" fill="var(--md-tertiary)" fill-opacity=".2" />
          <circle :cx="sun.x" :cy="sun.y" r="7" fill="var(--md-tertiary)" />
        </template>
      </svg>
    </div>
    <dl class="grid grid-cols-2 gap-3">
      <div class="rounded-2xl bg-surface-lowest/60 p-3">
        <dt class="flex items-center gap-1.5 text-xs font-medium">
          <SunIcon class="size-[18px]" aria-hidden="true" />Nascer
        </dt>
        <dd class="tabular mt-1 text-xl">{{ formatClock(sunrise, timezoneOffset) }}</dd>
      </div>
      <div class="rounded-2xl bg-surface-lowest/60 p-3">
        <dt class="flex items-center gap-1.5 text-xs font-medium">
          <MoonIcon class="size-[18px]" aria-hidden="true" />Pôr
        </dt>
        <dd class="tabular mt-1 text-xl">{{ formatClock(sunset, timezoneOffset) }}</dd>
      </div>
    </dl>
  </section>
</template>
