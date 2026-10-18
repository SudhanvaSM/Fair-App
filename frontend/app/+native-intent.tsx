export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return /(^|\/)reset-password(\?|#|$)/.test(path) ? path : '/';
}