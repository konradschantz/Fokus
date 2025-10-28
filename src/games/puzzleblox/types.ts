export interface ActiveBlock {
  id: string
  wasFloating?: boolean
}

export type BlockMatrix = (ActiveBlock | null)[][]
