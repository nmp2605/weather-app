<script setup lang="ts">
import {
  BoltIcon,
  CloudArrowDownIcon,
  CloudIcon,
  EyeSlashIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
} from '@heroicons/vue/24/solid'
import { computed, type Component } from 'vue'

import type { Condition, ConditionKind } from '@/domain/types'
import { capitalize } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    condition: Condition
    /** Hide from assistive tech when the description is already shown as text. */
    decorative?: boolean
    /** Apply the condition's color role; disable to color it from the parent. */
    toned?: boolean
  }>(),
  { decorative: false, toned: true },
)

// Heroicons has no rain, snow or fog glyphs; these are the closest metaphors.
const ICONS: Readonly<Record<ConditionKind, Component>> = {
  clear: SunIcon,
  'few-clouds': SunIcon,
  clouds: CloudIcon,
  drizzle: CloudArrowDownIcon,
  rain: CloudArrowDownIcon,
  thunderstorm: BoltIcon,
  snow: SparklesIcon,
  mist: EyeSlashIcon,
}

const TONES: Readonly<Record<ConditionKind, string>> = {
  clear: 'text-tertiary',
  'few-clouds': 'text-tertiary',
  clouds: 'text-secondary',
  drizzle: 'text-primary',
  rain: 'text-primary',
  thunderstorm: 'text-primary',
  snow: 'text-secondary',
  mist: 'text-secondary',
}

// Heroicons are functional components, which only inherit class, style and listeners,
// so the accessible name lives on a wrapping <span>.
const FALLBACK_LABELS: Readonly<Record<ConditionKind, string>> = {
  clear: 'Céu limpo',
  'few-clouds': 'Poucas nuvens',
  clouds: 'Nublado',
  drizzle: 'Garoa',
  rain: 'Chuva',
  thunderstorm: 'Tempestade',
  snow: 'Neve',
  mist: 'Névoa',
}

const isClearSky = computed(
  () => props.condition.kind === 'clear' || props.condition.kind === 'few-clouds',
)
const icon = computed(() =>
  props.condition.isNight && isClearSky.value ? MoonIcon : ICONS[props.condition.kind],
)
const label = computed(
  () => capitalize(props.condition.description) || FALLBACK_LABELS[props.condition.kind],
)
</script>

<template>
  <span
    class="inline-block shrink-0"
    :class="toned ? TONES[condition.kind] : undefined"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : label"
    :aria-hidden="decorative ? 'true' : undefined"
    :data-condition="condition.kind"
  >
    <component :is="icon" class="size-full" aria-hidden="true" />
  </span>
</template>
