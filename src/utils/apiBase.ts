const rawBaseUrl = (import.meta.env?.VITE_API_BASE_URL ?? '') as string
const normalizedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!normalizedBaseUrl) {
    return normalizedPath
  }
  return `${normalizedBaseUrl}${normalizedPath}`
}
