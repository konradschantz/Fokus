import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'

const KV_KEY = 'reaction-game:highscores'
const MAX_SCORES = 5

function sanitizeHighscores(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  const parsed = value
    .map((entry) => {
      if (typeof entry === 'number') {
        return entry
      }

      if (typeof entry === 'string') {
        const numeric = Number.parseFloat(entry)
        return Number.isFinite(numeric) ? numeric : Number.NaN
      }

      return Number.NaN
    })
    .filter((entry): entry is number => Number.isFinite(entry) && entry >= 0)

  parsed.sort((a, b) => a - b)

  return parsed.slice(0, MAX_SCORES)
}

async function parseRequestBody(req: VercelRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body)
      } catch (error) {
        console.error('Kunne ikke parse tekst-body for reaktionstest-highscores.', error)
        return null
      }
    }

    if (req.body && typeof req.body === 'object') {
      return req.body
    }
  }

  const chunks: Uint8Array[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  if (chunks.length === 0) {
    return null
  }

  const buffer = Buffer.concat(chunks)

  try {
    return JSON.parse(buffer.toString('utf-8'))
  } catch (error) {
    console.error('Kunne ikke parse stream-body for reaktionstest-highscores.', error)
    return null
  }
}

async function handleGet(res: VercelResponse) {
  try {
    const stored = await kv.get<number[] | null>(KV_KEY)
    const highscores = sanitizeHighscores(stored ?? [])

    res.status(200).json({ highscores })
  } catch (error) {
    console.error('Fejl ved hentning af reaktionstest-highscores.', error)
    res.status(500).json({ error: 'Kunne ikke hente highscores.' })
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const body = await parseRequestBody(req)
    const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
    const submitted = payload?.highscores ?? body
    const highscores = sanitizeHighscores(submitted)

    await kv.set(KV_KEY, highscores)

    res.status(200).json({ highscores })
  } catch (error) {
    console.error('Fejl ved opdatering af reaktionstest-highscores.', error)
    res.status(500).json({ error: 'Kunne ikke opdatere highscores.' })
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    await handleGet(res)
    return
  }

  if (req.method === 'POST') {
    await handlePost(req, res)
    return
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).json({ error: 'Method not allowed' })
}
