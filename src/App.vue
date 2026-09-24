<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import AppHeader from './components/AppHeader.vue'
import AppSnackbar from './components/AppSnackbar.vue'
import CitySearch from './components/CitySearch.vue'
import ErrorState from './components/ErrorState.vue'
import LinearProgress from './components/LinearProgress.vue'
import LoadingState from './components/LoadingState.vue'
import MissingApiKey from './components/MissingApiKey.vue'
import WeatherDashboard from './components/WeatherDashboard.vue'
import { useAutoRefresh } from './composables/useAutoRefresh'
import { useNow } from './composables/useNow'
import { useWeather } from './composables/useWeather'
import { AUTO_REFRESH_INTERVAL_MS } from './config/constants'
import { hasApiKey } from './config/env'
import { GEOLOCATION_ERROR_MESSAGES, MESSAGES } from './config/messages'
import type { Location, LocationSource } from './domain/types'
import { GeolocationError, getCurrentPosition } from './services/geolocation'
import { resolveInitialLocation } from './services/initialLocation'

const MANUAL_LOCATE_TIMEOUT_MS = 20_000

const apiKeyConfigured = hasApiKey()
const today = new Date()
const now = useNow()
const { report, status, error, isRefreshing, load, refresh, retry } = useWeather()

const source = ref<LocationSource | null>(null)
const locating = ref(false)
const notice = ref<string | null>(null)

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
      <WeatherDashboard
        :report="report"
        :now="now"
        :is-current-location="source === 'geolocation'"
        :refreshing="isRefreshing"
        @refresh="refresh"
      />
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
