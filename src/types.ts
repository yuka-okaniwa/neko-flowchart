export type Action = 'start' | 'end' | 'move' | 'pickUp' | 'deliver'

export type FlowNode = {
  id: string
  action: Action
  x: number
  y: number
}

export type FlowEdge = {
  id: string
  from: string
  to: string
}

export type StageTextPart = {
  text: string
  ruby?: string
}

export type StageDefinition = {
  id: string
  title: string
  difficulty: 'かんたん' | 'ふつう' | 'むずかしい'
  description: StageTextPart[]
  availableActions: Action[]
  start: { x: number; y: number }
  toy: { x: number; y: number }
  delivery: { x: number; y: number }
  grid: { columns: number; rows: number }
}

export type RunState = {
  cat: { x: number; y: number }
  hasToy: boolean
  status: 'idle' | 'running' | 'success' | 'error'
  message: string
}
