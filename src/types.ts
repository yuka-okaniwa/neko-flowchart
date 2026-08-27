export type Action = 'start' | 'end' | 'move' | 'pickUp' | 'pickUpSnack' | 'deliver' | 'decision' | 'openBox' | 'eat' | 'loopStart' | 'loopEnd'

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
  branch?: 'yes' | 'no'
}

export type StageTextPart = {
  text: string
  ruby?: string
}

export type TutorialStep =
  | { type: 'place'; action: Action; message: string }
  | { type: 'connect'; from: Action; to: Action; branch?: 'yes' | 'no'; message: string }
  | { type: 'run'; message: string }

/** 画面に表示する猫社員の名前と画像をまとめた設定。 */
export type CatEmployee = {
  id: string
  name: string
  imagePath: string
  alt: string
  profile: {
    role: string
    specialty: string
    honorific?: string
  }
}

export type StageDefinition = {
  id: string
  title: string
  difficulty: 'あそびかた' | 'かんたん' | 'ふつう' | 'むずかしい'
  description: StageTextPart[]
  availableActions: Action[]
  start: { x: number; y: number }
  toy: { x: number; y: number }
  snack?: { x: number; y: number }
  snacks?: { x: number; y: number }[]
  delivery: { x: number; y: number }
  box?: { x: number; y: number; content: 'toy' | 'snack' }
  grid: { columns: number; rows: number }
  hint: string
  decision?: {
    question: string
    answer: 'yes' | 'no'
  }
  loop?: {
    repeatUntil: number
    taskLabel: string
    taskEmoji: string
  }
  tutorial?: {
    steps: TutorialStep[]
  }
}

export type RunState = {
  cat: { x: number; y: number }
  hasToy: boolean
  snackCollected: boolean
  heldItem: 'none' | 'toy' | 'snack'
  boxOpened: boolean
  boxContent: 'toy' | 'snack' | null
  afterDecision: boolean
  loopCount: number
  status: 'idle' | 'running' | 'success' | 'error'
  message: string
}
