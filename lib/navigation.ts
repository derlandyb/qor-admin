/** Thin wrapper around a full page navigation so call sites (e.g. a 401 redirect) stay testable. */
export function redirectTo(path: string): void {
  window.location.href = path;
}
