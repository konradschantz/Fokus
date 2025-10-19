import { getApiUrl } from './apiBase'

export async function loadSortingBestScore(): Promise<number> {
  try {
    const response = await fetch(getApiUrl('/api/sorting-best-score'))

    if (!response.ok) {
      throw new Error(`Serveren svarede med status ${response.status}`)
    }

    const payload = (await response.json()) as { bestScore?: unknown } | undefined
    const value = payload?.bestScore

    const numeric =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseInt(value, 10)
          : Number.NaN

    return Number.isFinite(numeric) ? numeric : 0
  } catch (error) {
    console.error('Kunne ikke indlæse Sorting-rekorden fra serveren.', error)
    return 0
  }
}

export async function saveSortingBestScore(bestScore: number): Promise<void> {
  try {
    const response = await fetch(getApiUrl('/api/sorting-best-score'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bestScore }),
    })

    if (!response.ok) {
      throw new Error(`Serveren svarede med status ${response.status}`)
    }
  } catch (error) {
    console.error('Kunne ikke gemme Sorting-rekorden på serveren.', error)
  }
}
