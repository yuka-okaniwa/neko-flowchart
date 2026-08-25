import type { StageDefinition } from '../types'

export const stage2: StageDefinition = {
  id: 'inside-the-box',
  title: 'はこの なかみは？',
  difficulty: 'ふつう',
  description: [
    { text: 'はこを あけて、なかみが 「おもちゃ🧸」なら ヒト' },
    { text: '社員', ruby: 'しゃいん' },
    { text: '🧑‍💼にとどけよう。「おやつ🐟」なら たべよう。'}
  ],
  availableActions: ['move', 'openBox', 'decision', 'deliver', 'eat'],
  start: { x: 0, y: 1 },
  toy: { x: -1, y: -1 },
  delivery: { x: 2, y: 1 },
  grid: { columns: 3, rows: 3 },
  hint: 'はこを あけたら、なかみが おもちゃか どうかを たしかめよう。',
  decision: {
    question: 'なかみは\nおもちゃ？',
    answer: 'no',
  },
  box: { x: 1, y: 1, content: 'snack' },
}
