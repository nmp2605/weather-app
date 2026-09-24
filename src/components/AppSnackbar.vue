<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { onBeforeUnmount, watch } from 'vue'

import { SNACKBAR_DURATION_MS } from '@/config/constants'

const props = withDefaults(defineProps<{ message: string | null; duration?: number }>(), {
  duration: SNACKBAR_DURATION_MS,
})
const emit = defineEmits<{ dismiss: [] }>()

let timer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.message,
  (message) => {
    clearTimeout(timer)
    if (message) timer = setTimeout(() => emit('dismiss'), props.duration)
  },
  { immediate: true },
)

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center"
  >
    <div
      v-if="message"
      class="pointer-events-auto flex w-full max-w-xl animate-enter items-center gap-2 rounded-lg bg-inverse-surface py-1 pr-1 pl-4 text-sm text-inverse-on-surface shadow-elevation-3"
    >
      <p class="flex-1 py-2.5">{{ message }}</p>
      <button
        type="button"
        aria-label="Fechar aviso"
        class="state-layer focus-ring grid size-10 shrink-0 place-items-center rounded-full"
        @click="emit('dismiss')"
      >
        <XMarkIcon class="size-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
