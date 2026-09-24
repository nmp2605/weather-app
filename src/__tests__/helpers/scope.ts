import { effectScope } from 'vue'

export function withScope<T>(factory: () => T): { result: T; stop: () => void } {
  const scope = effectScope()
  const result = scope.run(factory) as T
  return { result, stop: () => scope.stop() }
}
