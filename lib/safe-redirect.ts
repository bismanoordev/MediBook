export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback: string,
) {
  // A leading slash alone is not sufficient: `\\\\host` is treated as an
  // external URL by the URL constructor. Keep redirects strictly internal.
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback
  }

  return value
}
