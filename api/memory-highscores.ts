import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'


type MemoryDifficulty = 'easy' | 'medium' | 'hard'

interface MemoryHighscoreEntry {
  bestMoves: number | null
  bestTimeMs: number | null
}

type MemoryHighscores = Record<MemoryDifficulty, MemoryHighscoreEntry>

const KV_KEY = 'memory-game:highscores'


const defaultEntry: MemoryHighscoreEntry = { bestMoves: null, bestTimeMs: null }

function createDefaultHighscores(): MemoryHighscores {
  return {
    easy: { ...defaultEntry },
    medium: { ...defaultEntry },
    hard: { ...defaultEntry },
  }
}

function sanitizeEntry(value: unknown): MemoryHighscoreEntry {
  if (!value || typeof value !== 'object') {
    return { ...defaultEntry }
  }

  const record = value as Record<string, unknown>
  const bestMoves = record.bestMoves
  const bestTimeMs = record.bestTimeMs

  return {
    bestMoves:
      typeof bestMoves === 'number' && Number.isFinite(bestMoves)
        ? bestMoves
        : null,
    bestTimeMs:
      typeof bestTimeMs === 'number' && Number.isFinite(bestTimeMs)
        ? bestTimeMs
        : null,
  }
}

function sanitizeHighscores(value: unknown): MemoryHighscores {
  if (!value || typeof value !== 'object') {
    return createDefaultHighscores()
  }

  const source = value as Record<string, unknown>

  return {
    easy: sanitizeEntry(source.easy),
    medium: sanitizeEntry(source.medium),
    hard: sanitizeEntry(source.hard),
  }
}






async function parseRequestBody(req: VercelRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body)
      } catch (error) {
        console.error('Kunne ikke parse tekst-body for memory-highscores.', error)
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
    console.error('Kunne ikke parse stream-body for memory-highscores.', error)
    return null
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const body = await parseRequestBody(req)
    const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
    const submitted = payload?.highscores ?? payload
    const highscores = sanitizeHighscores(submitted)

    await kv.set(KV_KEY, highscores)
    await writeToBlob(highscores)

    res.status(200).json({ highscores })
  } catch (error) {
    console.error('Fejl ved opdatering af memory-highscores.', error)
    res.status(500).json({ error: 'Kunne ikke opdatere highscores.' })
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
