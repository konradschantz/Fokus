import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'

interface OddOneOutScoreEntry {
  name: string
  score: number
  ts: number
}

const KV_KEY = 'odd-one-out:scores'
const DEFAULT_LIMIT = 5
const MAX_STORED_SCORES = 50

function sanitizeScoreEntry(value: unknown): OddOneOutScoreEntry | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const rawName = typeof record.name === 'string' ? record.name.trim() : ''
  const rawScore = record.score
  const rawTimestamp = record.ts

  if (!rawName) {
    return null
  }

  const score =
    typeof rawScore === 'number' && Number.isFinite(rawScore) && rawScore >= 0
      ? Math.floor(rawScore)
      : null

  if (score === null) {
    return null
  }

  const ts =
    typeof rawTimestamp === 'number' && Number.isFinite(rawTimestamp)
      ? Math.floor(rawTimestamp)
      : Date.now()

  return {
    name: rawName.slice(0, 64),
    score,
    ts,
  }
}

function sanitizeScores(value: unknown): OddOneOutScoreEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  const parsed = value
    .map((entry) => sanitizeScoreEntry(entry))
    .filter((entry): entry is OddOneOutScoreEntry => entry !== null)

  return sortScores(parsed)
}

function sortScores(entries: OddOneOutScoreEntry[]): OddOneOutScoreEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return a.ts - b.ts
  })
}

function parseLimitParam(raw: unknown): number {
  if (typeof raw === 'string' || typeof raw === 'number') {
    const parsed = Number.parseInt(String(raw), 10)
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.min(parsed, MAX_STORED_SCORES)
    }
  }

  return DEFAULT_LIMIT
}

async function parseRequestBody(req: VercelRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body)
      } catch (error) {
        console.error('Kunne ikke parse tekst-body for Odd One Out-highscores.', error)
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
    console.error('Kunne ikke parse stream-body for Odd One Out-highscores.', error)
    return null
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const stored = await kv.get<unknown>(KV_KEY)
    const scores = sanitizeScores(stored)
    const limit = parseLimitParam(req.query?.limit)
    res.status(200).json({ scores: scores.slice(0, limit) })
  } catch (error) {
    console.error('Fejl ved hentning af Odd One Out-highscores.', error)
    res.status(500).json({ error: 'Kunne ikke hente highscores.' })
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const body = await parseRequestBody(req)
    const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : null

    const entry = sanitizeScoreEntry({ ...payload, ts: Date.now() })

    if (!entry) {
      res.status(400).json({ error: 'Ugyldig highscore.' })
      return
    }

    const stored = await kv.get<unknown>(KV_KEY)
    const existingScores = sanitizeScores(stored)
    const updatedScores = sortScores([...existingScores, entry]).slice(0, MAX_STORED_SCORES)

    await kv.set(KV_KEY, updatedScores)

    res.status(201).json({ score: entry, scores: updatedScores })
  } catch (error) {
    console.error('Fejl ved opdatering af Odd One Out-highscores.', error)
    res.status(500).json({ error: 'Kunne ikke opdatere highscores.' })
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    await handleGet(req, res)
    return
  }

  if (req.method === 'POST') {
    await handlePost(req, res)
    return
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).json({ error: 'Method not allowed' })
}
