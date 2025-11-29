import { useCallback, useEffect, useMemo, useState } from 'react'
import './WordSearchGame.css'

type Coord = { row: number; col: number }

type WordPlacement = {
  word: string
  positions: Coord[]
  found: boolean
}

type WordSearchGameProps = {
  startSignal?: number
  onFinished?: (summary: { found: number; total: number; gridSize: number; mistakes: number }) => void
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ'
const DEFAULT_GRID_SIZE = 10
const DEFAULT_WORDS = [
  'FOKUS',
  'BALANCE',
  'HUKOMMELSE',
  'LOGIK',
  'RO',
  'STRATEGI',
  'FLOW',
  'RUTINE',
  'TEMPO',
  'MØNSTER',
]

const directions: Coord[] = [
  { row: 0, col: 1 },
  { row: 0, col: -1 },
  { row: 1, col: 0 },
  { row: -1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
  { row: -1, col: 1 },
  { row: -1, col: -1 },
]

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

function normalizeWords(input: string, gridSize: number) {
  const rawWords = input
    .split(/[\n,;]+/)
    .map((word) => word.replace(/[^A-Za-zÆØÅæøå]/g, '').toUpperCase())
    .filter(Boolean)

  const sanitized = rawWords.filter((word) => word.length >= 2 && word.length <= gridSize)

  if (sanitized.length === 0) {
    return DEFAULT_WORDS.filter((word) => word.length <= gridSize)
  }

  return sanitized
}

function canPlaceWord(grid: string[][], word: string, start: Coord, direction: Coord) {
  const size = grid.length
  for (let index = 0; index < word.length; index += 1) {
    const row = start.row + direction.row * index
    const col = start.col + direction.col * index
    if (row < 0 || col < 0 || row >= size || col >= size) return false
    const cell = grid[row][col]
    if (cell !== '' && cell !== word[index]) return false
  }
  return true
}

function placeWord(grid: string[][], word: string): Coord[] | null {
  const size = grid.length
  const maxAttempts = 200

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const direction = directions[Math.floor(Math.random() * directions.length)]
    const rowMin = direction.row < 0 ? word.length - 1 : 0
    const rowMax = direction.row > 0 ? size - word.length : size - 1
    const colMin = direction.col < 0 ? word.length - 1 : 0
    const colMax = direction.col > 0 ? size - word.length : size - 1

    if (rowMax < rowMin || colMax < colMin) continue

    const start: Coord = {
      row: rowMin + Math.floor(Math.random() * (rowMax - rowMin + 1)),
      col: colMin + Math.floor(Math.random() * (colMax - colMin + 1)),
    }

    if (!canPlaceWord(grid, word, start, direction)) continue

    const positions: Coord[] = []
    for (let index = 0; index < word.length; index += 1) {
      const row = start.row + direction.row * index
      const col = start.col + direction.col * index
      grid[row][col] = word[index]
      positions.push({ row, col })
    }

    return positions
  }

  return null
}

function buildPuzzle(words: string[], gridSize: number) {
  const grid: string[][] = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => ''))
  const placements: WordPlacement[] = []

  const shuffledWords = [...words].sort(() => Math.random() - 0.5)

  for (const word of shuffledWords) {
    const positions = placeWord(grid, word)
    if (positions) {
      placements.push({ word, positions, found: false })
    }
  }

  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      if (grid[row][col] === '') {
        grid[row][col] = randomLetter()
      }
    }
  }

  return { grid, placements }
}

function getLineBetween(start: Coord, end: Coord): Coord[] | null {
  const rowDiff = end.row - start.row
  const colDiff = end.col - start.col

  if (rowDiff === 0 && colDiff === 0) {
    return [start]
  }

  const isStraight = rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff)
  if (!isStraight) return null

  const stepRow = Math.sign(rowDiff)
  const stepCol = Math.sign(colDiff)
  const length = Math.max(Math.abs(rowDiff), Math.abs(colDiff))

  const path: Coord[] = []
  for (let index = 0; index <= length; index += 1) {
    path.push({ row: start.row + stepRow * index, col: start.col + stepCol * index })
  }
  return path
}

export default function WordSearchGame({ startSignal, onFinished }: WordSearchGameProps) {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE)
  const [wordInput, setWordInput] = useState(DEFAULT_WORDS.join(', '))
  const [grid, setGrid] = useState<string[][]>([])
  const [placements, setPlacements] = useState<WordPlacement[]>([])
  const [activePath, setActivePath] = useState<Coord[]>([])
  const [dragStart, setDragStart] = useState<Coord | null>(null)
  const [clickStart, setClickStart] = useState<Coord | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [message, setMessage] = useState('Markér ord vandret, lodret eller diagonalt.')
  const [mistakes, setMistakes] = useState(0)
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set())

  const activePathKeys = useMemo(() => new Set(activePath.map((coord) => `${coord.row}-${coord.col}`)), [activePath])
  const foundCount = useMemo(() => placements.filter((placement) => placement.found).length, [placements])

  const applySettings = useCallback(() => {
    const normalizedWords = normalizeWords(wordInput, gridSize)
    const { grid: newGrid, placements: newPlacements } = buildPuzzle(normalizedWords, gridSize)
    setGrid(newGrid)
    setPlacements(newPlacements)
    setActivePath([])
    setDragStart(null)
    setClickStart(null)
    setIsDragging(false)
    setMessage('Markér ord vandret, lodret eller diagonalt.')
    setMistakes(0)
    setFoundCells(new Set())
  }, [gridSize, wordInput])

  useEffect(() => {
    applySettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (startSignal === undefined || startSignal === 0) return
    applySettings()
  }, [applySettings, startSignal])

  const commitSelection = (path: Coord[] | null) => {
    if (!path || path.length === 0) {
      setMessage('Markering skal være en lige linje.')
      setActivePath([])
      setClickStart(null)
      setDragStart(null)
      return
    }

    const wordForward = path.map((coord) => grid[coord.row][coord.col]).join('')
    const wordBackward = wordForward.split('').reverse().join('')
    const matchIndex = placements.findIndex(
      (placement) => !placement.found && (placement.word === wordForward || placement.word === wordBackward),
    )

    if (matchIndex >= 0) {
      const matched = placements[matchIndex]
      const updatedPlacements = placements.map((placement, index) =>
        index === matchIndex ? { ...placement, found: true } : placement,
      )
      const updatedFoundCells = new Set(foundCells)
      matched.positions.forEach((coord) => updatedFoundCells.add(`${coord.row}-${coord.col}`))

      setPlacements(updatedPlacements)
      setFoundCells(updatedFoundCells)
      setMessage(`Fundet: ${matched.word}`)

      const nextFound = foundCount + 1
      if (nextFound === updatedPlacements.length) {
        onFinished?.({
          found: nextFound,
          total: updatedPlacements.length,
          gridSize,
          mistakes,
        })
        setMessage('Alle ord fundet!')
      }
    } else {
      setMistakes((prev) => prev + 1)
      setMessage('Ikke på ordlisten. Prøv igen.')
    }

    setActivePath([])
    setClickStart(null)
    setDragStart(null)
  }

  const handleCellMouseDown = (coord: Coord) => {
    setIsDragging(true)
    setDragStart(coord)
    setClickStart(null)
    setActivePath([coord])
  }

  const handleCellMouseEnter = (coord: Coord) => {
    if (!isDragging || !dragStart) return
    const path = getLineBetween(dragStart, coord)
    setActivePath(path ?? [dragStart])
  }

  const handleCellMouseUp = (coord: Coord) => {
    if (dragStart) {
      commitSelection(getLineBetween(dragStart, coord))
    }
    setIsDragging(false)
  }

  const handleCellClick = (coord: Coord) => {
    if (isDragging) return
    if (!clickStart) {
      setClickStart(coord)
      setActivePath([coord])
      setMessage('Vælg slutpunkt i samme linje for at bekræfte.')
      return
    }

    commitSelection(getLineBetween(clickStart, coord))
  }

  const handleLeaveGrid = () => {
    setIsDragging(false)
    setActivePath([])
    setDragStart(null)
    setClickStart(null)
  }

  const remaining = placements.length - foundCount

  return (
    <div className="word-search">
      <div className="word-search__panel">
        <div>
          <p className="word-search__eyebrow">Konfiguration</p>
          <div className="word-search__controls">
            <label className="word-search__control">
              <span>Gitterstørrelse</span>
              <div className="word-search__control-row">
                <input
                  type="range"
                  min={6}
                  max={14}
                  value={gridSize}
                  onChange={(event) => setGridSize(Number(event.target.value))}
                  aria-label="Vælg gitterstørrelse"
                />
                <span className="word-search__badge">
                  {gridSize} × {gridSize}
                </span>
              </div>
            </label>

            <label className="word-search__control">
              <span>Ordliste (kommasepareret)</span>
              <textarea
                value={wordInput}
                onChange={(event) => setWordInput(event.target.value)}
                rows={3}
                aria-label="Redigér ordliste"
              />
            </label>

            <div className="word-search__actions">
              <button type="button" className="menu__primary-button" onClick={applySettings}>
                Generér puslespil
              </button>
              <button type="button" className="menu__secondary-button" onClick={() => setWordInput(DEFAULT_WORDS.join(', '))}>
                Gendan standardord
              </button>
            </div>
          </div>
        </div>

        <div className="word-search__status">
          <div>
            <p>Ord fundet</p>
            <strong>
              {foundCount} / {placements.length || '-'}
            </strong>
          </div>
          <div>
            <p>Tilbage</p>
            <strong>{placements.length === 0 ? '-' : remaining}</strong>
          </div>
          <div>
            <p>Fejlmarkeringer</p>
            <strong>{mistakes}</strong>
          </div>
        </div>
      </div>

      <div className="word-search__layout">
        <div className="word-search__grid-wrapper" onMouseLeave={handleLeaveGrid}>
          <div
            className="word-search__grid"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(28px, 1fr))` }}
            role="grid"
            aria-label={`Ordjagt i et ${gridSize} gange ${gridSize} gitter`}
          >
            {grid.map((row, rowIndex) =>
              row.map((letter, colIndex) => {
                const key = `${rowIndex}-${colIndex}`
                const isFound = foundCells.has(key)
                const isActive = activePathKeys.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    className={`word-search__cell ${isFound ? 'is-found' : ''} ${isActive ? 'is-active' : ''}`}
                    onMouseDown={() => handleCellMouseDown({ row: rowIndex, col: colIndex })}
                    onMouseEnter={() => handleCellMouseEnter({ row: rowIndex, col: colIndex })}
                    onMouseUp={() => handleCellMouseUp({ row: rowIndex, col: colIndex })}
                    onClick={() => handleCellClick({ row: rowIndex, col: colIndex })}
                    role="gridcell"
                    aria-label={`Række ${rowIndex + 1}, kolonne ${colIndex + 1}, bogstav ${letter}`}
                  >
                    <span>{letter}</span>
                  </button>
                )
              }),
            )}
          </div>
          <p className="word-search__message" role="status">
            {message}
          </p>
        </div>

        <div className="word-search__wordlist" aria-label="Ord der skal findes">
          <div className="word-search__wordlist-header">
            <p>Ord der gemmer sig</p>
            <span className="word-search__badge word-search__badge--muted">{placements.length} ord</span>
          </div>
          <ul>
            {placements.map((placement) => (
              <li key={placement.word} className={placement.found ? 'is-found' : ''}>
                <span>{placement.word}</span>
                {placement.found ? <span aria-hidden="true">✓</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
