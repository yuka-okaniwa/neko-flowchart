import type { StageDefinition } from '../types'

export const stage1: StageDefinition = {
  id: 'snack-delivery',
  title: 'おやつを とどけよう',
  difficulty: 'かんたん',
  description: 'ねこ社員に、おやつを ひろって とどける てじゅんを おしえてあげよう。',
  availableActions: ['start', 'move', 'pickUp', 'deliver', 'end'],
  start: { x: 0, y: 1 },
  snack: { x: 1, y: 1 },
  delivery: { x: 3, y: 1 },
  grid: { columns: 4, rows: 3 },
}
