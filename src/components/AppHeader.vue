<script setup lang="ts">
import { CloudIcon } from '@heroicons/vue/24/solid'
import { computed } from 'vue'

import { formatHeaderDate } from '@/utils/time'

const props = defineProps<{ today: Date }>()

const isoDate = computed(() => props.today.toISOString().slice(0, 10))
</script>

<template>
  <header class="sticky top-0 z-30 bg-surface/95 backdrop-blur">
    <div
      class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-6 lg:px-8"
    >
      <div class="flex items-center gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-on-primary"
        >
          <CloudIcon class="size-6" aria-hidden="true" />
        </span>
        <div class="leading-tight">
          <h1 class="text-[22px] font-normal">Boletim do Tempo</h1>
          <p class="text-xs text-on-surface-variant">
            <time :datetime="isoDate">{{ formatHeaderDate(today) }}</time>
          </p>
        </div>
      </div>

      <slot />
    </div>
  </header>
</template>
