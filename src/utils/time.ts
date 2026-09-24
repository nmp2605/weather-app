/*
 * OpenWeatherMap reports Unix timestamps plus the city's UTC offset. Shifting the
 * timestamp by the offset and formatting in UTC shows the city's wall-clock time,
 * whatever the viewer's own time zone is.
 */

const LOCALE = 'pt-BR'

function shifted(unixSeconds: number, offsetSeconds: number): Date {
  return new Date((unixSeconds + offsetSeconds) * 1000)
}

const clockFormat = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
})

const weekdayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: 'UTC' })

const headerFormat = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
})

/** "qua." → "Qua" */
function tidyWeekday(value: string): string {
  const clean = value.replace('.', '')
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

/** City-local calendar date as YYYY-MM-DD. */
export function localDateKey(unixSeconds: number, offsetSeconds: number): string {
  return shifted(unixSeconds, offsetSeconds).toISOString().slice(0, 10)
}

export function localHour(unixSeconds: number, offsetSeconds: number): number {
  return shifted(unixSeconds, offsetSeconds).getUTCHours()
}

/** "15:20" */
export function formatClock(unixSeconds: number, offsetSeconds: number): string {
  return clockFormat.format(shifted(unixSeconds, offsetSeconds))
}

/** "18h" */
export function formatHourLabel(unixSeconds: number, offsetSeconds: number): string {
  return `${String(localHour(unixSeconds, offsetSeconds)).padStart(2, '0')}h`
}

/** "Qui" */
export function formatWeekday(unixSeconds: number, offsetSeconds: number): string {
  return tidyWeekday(weekdayFormat.format(shifted(unixSeconds, offsetSeconds)))
}

/** "Qua, 23 de setembro" in the viewer's own time zone. */
export function formatHeaderDate(date: Date): string {
  const parts = headerFormat.formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${tidyWeekday(part('weekday'))}, ${part('day')} de ${part('month')}`
}
