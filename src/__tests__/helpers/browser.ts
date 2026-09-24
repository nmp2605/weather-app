type Success = (position: GeolocationPosition) => void
type Failure = (error: GeolocationPositionError) => void

export type GetCurrentPosition = (
  success: Success,
  failure: Failure,
  options?: PositionOptions,
) => void

function define(target: object, key: string, value: unknown) {
  Object.defineProperty(target, key, { value, configurable: true, writable: true })
}

export function stubGeolocation(getCurrentPosition: GetCurrentPosition) {
  define(navigator, 'geolocation', { getCurrentPosition })
}

export function positionAt(lat: number, lon: number): GeolocationPosition {
  return { coords: { latitude: lat, longitude: lon } } as GeolocationPosition
}

export function positionError(code: number): GeolocationPositionError {
  return { code, message: `error ${code}` } as GeolocationPositionError
}

export function stubPermission(result: PermissionState | Error) {
  define(navigator, 'permissions', {
    query: () =>
      result instanceof Error ? Promise.reject(result) : Promise.resolve({ state: result }),
  })
}

let hidden = false

export function setDocumentHidden(value: boolean) {
  hidden = value
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
}

export function clearBrowserStubs() {
  const nav = navigator as unknown as Record<string, unknown>
  delete nav.geolocation
  delete nav.permissions
  delete (document as unknown as Record<string, unknown>).hidden
  hidden = false
}
