<script setup lang="ts">
import LinearProgress from './LinearProgress.vue'

defineProps<{ message: string }>()
</script>

<template>
  <div aria-busy="true" class="mt-2">
    <p class="sr-only" role="status">{{ message }}</p>
    <LinearProgress :label="message" class="mb-4" />
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6" aria-hidden="true">
      <div
        class="h-80 animate-pulse rounded-[28px] bg-primary-container/60 sm:h-[360px] lg:col-span-8"
      ></div>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:col-span-4 lg:grid-cols-2 lg:gap-6">
        <div
          class="col-span-2 h-36 animate-pulse rounded-[28px] bg-surface-container md:row-span-2 md:h-auto lg:row-span-1 lg:h-36"
        ></div>
        <div
          v-for="n in 4"
          :key="n"
          class="h-28 animate-pulse rounded-[28px] bg-surface-container"
        ></div>
      </div>
      <div class="h-56 animate-pulse rounded-[28px] bg-surface-low lg:col-span-12"></div>
    </div>
  </div>
</template>
