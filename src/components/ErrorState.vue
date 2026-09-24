<script setup lang="ts">
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue'

import type { WeatherErrorKind } from '@/api/errors'
import { WEATHER_ERROR_CONTENT } from '@/config/messages'

const props = defineProps<{ kind: WeatherErrorKind }>()
defineEmits<{ retry: [] }>()

const content = computed(() => WEATHER_ERROR_CONTENT[props.kind])
</script>

<template>
  <section
    role="alert"
    class="mt-2 flex flex-col items-start gap-4 rounded-[28px] bg-error-container p-6 text-on-error-container sm:flex-row sm:p-8"
  >
    <span class="grid size-14 shrink-0 place-items-center rounded-full bg-error text-on-error">
      <ExclamationTriangleIcon class="size-7" aria-hidden="true" />
    </span>
    <div class="flex-1">
      <h2 class="text-2xl font-normal">{{ content.title }}</h2>
      <p class="mt-2 max-w-xl text-sm opacity-90">{{ content.description }}</p>
      <button
        type="button"
        class="state-layer focus-ring mt-5 flex h-10 items-center gap-2 rounded-full bg-error px-6 text-sm font-medium text-on-error"
        @click="$emit('retry')"
      >
        <ArrowPathIcon class="size-[18px]" aria-hidden="true" />
        Tentar novamente
      </button>
    </div>
  </section>
</template>
