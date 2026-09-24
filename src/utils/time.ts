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

const headerWeekdayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' })

const headerDayFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long' })

function tidyWeekday(value: string): string {
  const clean = value.replace('.', '')
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

export function localDateKey(unixSeconds: number, offsetSeconds: number): string {
  return shifted(unixSeconds, offsetSeconds).toISOString().slice(0, 10)
}

export function localHour(unixSeconds: number, offsetSeconds: number): number {
  return shifted(unixSeconds, offsetSeconds).getUTCHours()
}

export function formatClock(unixSeconds: number, offsetSeconds: number): string {
  return clockFormat.format(shifted(unixSeconds, offsetSeconds))
}

export function formatHourLabel(unixSeconds: number, offsetSeconds: number): string {
  return `${String(localHour(unixSeconds, offsetSeconds)).padStart(2, '0')}h`
}

export function formatWeekday(unixSeconds: number, offsetSeconds: number): string {
  return tidyWeekday(weekdayFormat.format(shifted(unixSeconds, offsetSeconds)))
}

export function formatHeaderDate(date: Date): string {
  return `${tidyWeekday(headerWeekdayFormat.format(date))}, ${headerDayFormat.format(date)}`
}
