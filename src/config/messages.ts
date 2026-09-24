import { DEFAULT_LOCATION } from './constants'
import type { WeatherErrorKind } from '@/api/errors'
import type { GeolocationErrorKind } from '@/services/geolocation'

export const MESSAGES = {
  locationFallback: `Não foi possível usar sua localização. Mostrando ${DEFAULT_LOCATION.name}.`,
  refreshFailed: 'Não foi possível atualizar os dados. Mostrando a última leitura.',
} as const

export const GEOLOCATION_ERROR_MESSAGES: Readonly<Record<GeolocationErrorKind, string>> = {
  unsupported: 'Seu navegador não permite obter a localização.',
  denied: 'Permissão de localização negada. Libere o acesso nas configurações do navegador.',
  unavailable: 'Não foi possível determinar sua localização agora.',
  timeout: 'A localização demorou demais para responder. Tente novamente.',
}

export interface ErrorContent {
  title: string
  description: string
}

export const WEATHER_ERROR_CONTENT: Readonly<Record<WeatherErrorKind, ErrorContent>> = {
  'not-found': {
    title: 'Não encontramos essa cidade',
    description:
      'Confira a grafia ou inclua o estado, por exemplo “Floriano, PI”. Se o problema continuar, a OpenWeatherMap pode estar instável.',
  },
  unauthorized: {
    title: 'Chave de API inválida',
    description:
      'A OpenWeatherMap recusou a chave configurada. Confira o valor em VITE_OPENWEATHER_API_KEY. Chaves novas podem levar algumas horas para serem ativadas.',
  },
  'rate-limit': {
    title: 'Limite de requisições atingido',
    description: 'A conta atingiu o limite de chamadas da OpenWeatherMap. Aguarde alguns minutos.',
  },
  network: {
    title: 'Sem conexão com a OpenWeatherMap',
    description: 'Verifique sua conexão com a internet e tente novamente.',
  },
  unknown: {
    title: 'Algo deu errado',
    description: 'Não foi possível carregar os dados do tempo. Tente novamente em instantes.',
  },
}
