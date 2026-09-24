import type { Condition, ConditionKind } from './types'
import type { OwmCondition } from '@/api/types'

const KIND_BY_CODE: Readonly<Record<number, ConditionKind>> = {
  800: 'clear',
  801: 'few-clouds',
}

const KIND_BY_GROUP: Readonly<Record<number, ConditionKind>> = {
  2: 'thunderstorm',
  3: 'drizzle',
  5: 'rain',
  6: 'snow',
  7: 'mist',
}

export function toConditionKind(id: number): ConditionKind {
  return KIND_BY_CODE[id] ?? KIND_BY_GROUP[Math.floor(id / 100)] ?? 'clouds'
}

export function toCondition(raw: OwmCondition | undefined): Condition {
  if (!raw) return { kind: 'clouds', description: '', isNight: false }
  return {
    kind: toConditionKind(raw.id),
    description: raw.description,
    isNight: raw.icon.endsWith('n'),
  }
}
