import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'

const KV_KEY = 'sorting-game:best-score'

function parseBestScore(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

async function readBestScore(): Promise<number> {
  try {
    const stored = await kv.get<unknown>(KV_KEY)
    const parsed = parseBestScore(stored)
    return parsed ?? 0
  } catch (error) {
    console.error('Kunne ikke hente Sorting-rekorden fra Vercel KV.', error)
    return 0
  }
}

async function parseRequestBody(req: VercelRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body)
      } catch (error) {
        console.error('Kunne ikke parse tekst-body for Sorting-rekorden.', error)
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
    console.error('Kunne ikke parse stream-body for Sorting-rekorden.', error)
    return null
  }
}

async function handleGet(res: VercelResponse) {
  const bestScore = await readBestScore()
  res.status(200).json({ bestScore })
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const body = await parseRequestBody(req)
    const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
    const submittedScore = parseBestScore(payload?.bestScore ?? payload)

    if (submittedScore === null || submittedScore < 0) {
      res.status(400).json({ error: 'Ugyldig score.' })
      return
    }

    const currentBest = await readBestScore()

    if (submittedScore <= currentBest) {
      res.status(200).json({ bestScore: currentBest })
      return
    }

    await kv.set(KV_KEY, submittedScore)
    res.status(200).json({ bestScore: submittedScore })
  } catch (error) {
    console.error('Kunne ikke opdatere Sorting-rekorden i Vercel KV.', error)
    res.status(500).json({ error: 'Kunne ikke opdatere score.' })
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
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
