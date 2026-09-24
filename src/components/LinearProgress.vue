<script setup lang="ts">
// M3 indeterminate linear progress indicator.
defineProps<{ label: string }>()
</script>

<template>
  <div
    role="progressbar"
    :aria-label="label"
    class="h-1 overflow-hidden rounded-full bg-secondary-container"
  >
    <div class="h-full w-full origin-left animate-indeterminate rounded-full bg-primary"></div>
  </div>
</template>
