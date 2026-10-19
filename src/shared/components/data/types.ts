export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl'

/** Definição de coluna para <DataTable>. */
export interface Column {
  /** Identifica a coluna e o slot `cell-<key>` (se não houver slot, usa row[key]). */
  key: string
  label: string
  /** Esconde a coluna abaixo deste breakpoint. */
  hideBelow?: Breakpoint
  align?: 'left' | 'right' | 'center'
  /** Classe extra para <th>/<td> (ex.: largura). */
  class?: string
}

export type ViewMode = 'cards' | 'list'
