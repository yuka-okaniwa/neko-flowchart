import type { StageDefinition } from '../types'

export const stage1: StageDefinition = {
  id: 'toy-delivery',
  title: 'おもちゃを とどけよう',
  difficulty: 'かんたん',
  description: [
    { text: '「おもちゃ🧸を ひろって 「ヒト'},
    { text: '社員', ruby: 'しゃいん' },
    { text: '🧑‍💼」に とどける てじゅんを おしえてね' },
  ],
  // 開始・終了は編集領域に固定で用意する。ここには何度でも追加できる処理だけを置く。
  availableActions: ['move', 'pickUp', 'deliver'],
  start: { x: 0, y: 1 },
  toy: { x: 1, y: 1 },
  delivery: { x: 3, y: 1 },
  grid: { columns: 4, rows: 3 },
  hint: 'おもちゃを ひろってから、ヒト社員に とどけよう。',
}
