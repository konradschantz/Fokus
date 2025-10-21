import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'
import { randomUUID } from 'node:crypto'

interface OddOneOutUserEntry {
  id: string
  name: string
  createdAt: number
}

const KV_KEY = 'odd-one-out:users'
const MAX_STORED_USERS = 200

function sanitizeUserEntry(value: unknown): OddOneOutUserEntry | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id : ''
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  const createdAt = record.createdAt

  if (!id || !name) {
    return null
  }

  const timestamp =
    typeof createdAt === 'number' && Number.isFinite(createdAt)
      ? Math.floor(createdAt)
      : Date.now()

  return {
    id,
    name: name.slice(0, 64),
    createdAt: timestamp,
  }
}

function sanitizeUsers(value: unknown): OddOneOutUserEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  const parsed = value
    .map((entry) => sanitizeUserEntry(entry))
    .filter((entry): entry is OddOneOutUserEntry => entry !== null)

  return parsed.sort((a, b) => b.createdAt - a.createdAt)
}

async function parseRequestBody(req: VercelRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body)
      } catch (error) {
        console.error('Kunne ikke parse tekst-body for Odd One Out-brugere.', error)
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
    console.error('Kunne ikke parse stream-body for Odd One Out-brugere.', error)
    return null
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const body = await parseRequestBody(req)
    const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
    const rawName = typeof payload?.name === 'string' ? payload.name.trim() : ''

    if (!rawName) {
      res.status(400).json({ error: 'Ugyldigt brugernavn.' })
      return
    }

    const user: OddOneOutUserEntry = {
      id: randomUUID(),
      name: rawName.slice(0, 64),
      createdAt: Date.now(),
    }

    const stored = await kv.get<unknown>(KV_KEY)
    const existingUsers = sanitizeUsers(stored)
    const updatedUsers = [user, ...existingUsers].slice(0, MAX_STORED_USERS)

    await kv.set(KV_KEY, updatedUsers)

    res.status(201).json({ user })
  } catch (error) {
    console.error('Fejl ved oprettelse af Odd One Out-bruger.', error)
    res.status(500).json({ error: 'Kunne ikke oprette bruger.' })
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'POST') {
    await handlePost(req, res)
    return
  }

  res.setHeader('Allow', 'POST')
  res.status(405).json({ error: 'Method not allowed' })
}
