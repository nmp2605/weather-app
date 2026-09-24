<script setup lang="ts">
import { computed } from 'vue'

import CurrentWeatherCard from './CurrentWeatherCard.vue'
import DailyForecast from './DailyForecast.vue'
import HourlyForecast from './HourlyForecast.vue'
import SunCard from './SunCard.vue'
import WeatherIndicators from './WeatherIndicators.vue'
import type { WeatherReport } from '@/domain/types'
import { localDateKey } from '@/utils/time'

const props = defineProps<{
  report: WeatherReport
  now: number
  isCurrentLocation: boolean
  refreshing: boolean
}>()
defineEmits<{ refresh: [] }>()

const todayKey = computed(() => localDateKey(props.now, props.report.timezoneOffset))
const today = computed(() => props.report.daily.find((day) => day.date === todayKey.value))
</script>

<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
    <CurrentWeatherCard
      :location="report.location"
      :current="report.current"
      :today="today"
      :timezone-offset="report.timezoneOffset"
      :now="now"
      :is-current-location="isCurrentLocation"
      :refreshing="refreshing"
      @refresh="$emit('refresh')"
    />
    <WeatherIndicators :current="report.current" />
    <HourlyForecast :points="report.hourly" :timezone-offset="report.timezoneOffset" />
    <DailyForecast
      :days="report.daily"
      :timezone-offset="report.timezoneOffset"
      :today-key="todayKey"
    />
    <SunCard
      :sunrise="report.current.sunrise"
      :sunset="report.current.sunset"
      :now="now"
      :timezone-offset="report.timezoneOffset"
    />
  </div>
</template>
