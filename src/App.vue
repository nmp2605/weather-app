<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import AppHeader from './components/AppHeader.vue'
import AppSnackbar from './components/AppSnackbar.vue'
import CitySearch from './components/CitySearch.vue'
import CurrentWeatherCard from './components/CurrentWeatherCard.vue'
import DailyForecast from './components/DailyForecast.vue'
import ErrorState from './components/ErrorState.vue'
import HourlyForecast from './components/HourlyForecast.vue'
import LinearProgress from './components/LinearProgress.vue'
import LoadingState from './components/LoadingState.vue'
import MissingApiKey from './components/MissingApiKey.vue'
import SunCard from './components/SunCard.vue'
import WeatherIndicators from './components/WeatherIndicators.vue'
import { useAutoRefresh } from './composables/useAutoRefresh'
import { useNow } from './composables/useNow'
import { useWeather } from './composables/useWeather'
import { AUTO_REFRESH_INTERVAL_MS } from './config/constants'
import { hasApiKey } from './config/env'
import { GEOLOCATION_ERROR_MESSAGES, MESSAGES } from './config/messages'
import type { Location, LocationSource } from './domain/types'
import { GeolocationError, getCurrentPosition } from './services/geolocation'
import { resolveInitialLocation } from './services/initialLocation'
import { localDateKey } from './utils/time'

/** The manual "use my location" button waits longer: the user may still be reading the prompt. */
const MANUAL_LOCATE_TIMEOUT_MS = 20_000

const apiKeyConfigured = hasApiKey()
const today = new Date()
const now = useNow()
const { report, status, error, isRefreshing, load, refresh, retry } = useWeather()

const source = ref<LocationSource | null>(null)
const locating = ref(false)
const notice = ref<string | null>(null)

const todayKey = computed(() =>
  report.value ? localDateKey(now.value, report.value.timezoneOffset) : '',
)
const todaySummary = computed(() => report.value?.daily.find((day) => day.date === todayKey.value))
const showLoading = computed(
  () => (locating.value && !report.value) || status.value === 'loading' || status.value === 'idle',
)
const loadingMessage = computed(() =>
  locating.value ? 'Localizando você…' : 'Carregando dados do tempo…',
)

onMounted(async () => {
  if (!apiKeyConfigured) return
  locating.value = true
  const initial = await resolveInitialLocation()
  locating.value = false
  source.value = initial.source
  notice.value = initial.notice ?? null
  await load(initial.request)
})

function onSelect(location: Location) {
  source.value = 'search'
  void load({ coords: location, location })
}

async function onLocate() {
  locating.value = true
  try {
    const coords = await getCurrentPosition(MANUAL_LOCATE_TIMEOUT_MS)
    source.value = 'geolocation'
    await load({ coords })
  } catch (caught) {
    const kind = caught instanceof GeolocationError ? caught.kind : 'unavailable'
    notice.value = GEOLOCATION_ERROR_MESSAGES[kind]
  } finally {
    locating.value = false
  }
}

watch(error, (value) => {
  if (value && status.value === 'success') notice.value = MESSAGES.refreshFailed
})

useAutoRefresh(() => {
  if (status.value === 'success') void refresh()
}, AUTO_REFRESH_INTERVAL_MS)
</script>

<template>
  <AppHeader :today="today">
    <CitySearch
      v-if="apiKeyConfigured"
      :locating="locating"
      @select="onSelect"
      @locate="onLocate"
    />
  </AppHeader>

  <div class="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
    <MissingApiKey v-if="!apiKeyConfigured" />

    <ErrorState v-else-if="status === 'error' && error" :kind="error.kind" @retry="retry" />

    <LoadingState v-else-if="showLoading || !report" :message="loadingMessage" />

    <main v-else class="mt-2" :aria-busy="isRefreshing">
      <LinearProgress
        v-if="isRefreshing || locating"
        :label="locating ? 'Localizando você…' : 'Atualizando dados'"
        class="mb-3"
      />
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <CurrentWeatherCard
          :location="report.location"
          :current="report.current"
          :today="todaySummary"
          :timezone-offset="report.timezoneOffset"
          :now="now"
          :is-current-location="source === 'geolocation'"
          :refreshing="isRefreshing"
          @refresh="refresh"
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
    </main>

    <footer class="mt-8 text-xs text-on-surface-variant">
      <p>
        Dados fornecidos por
        <a
          href="https://openweathermap.org/"
          target="_blank"
          rel="noopener noreferrer"
          class="focus-ring underline underline-offset-2"
          >OpenWeatherMap</a
        >
        · Ícones Heroicons
      </p>
    </footer>
  </div>

  <AppSnackbar :message="notice" @dismiss="notice = null" />
</template>
