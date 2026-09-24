export function getApiKey(): string {
  return (import.meta.env.VITE_OPENWEATHER_API_KEY ?? '').trim()
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0
}
