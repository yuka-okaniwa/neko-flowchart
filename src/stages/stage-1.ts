import type { StageDefinition } from '../types'

export const stage1: StageDefinition = {
  id: 'toy-delivery',
  title: 'おもちゃを とどけよう',
  difficulty: 'かんたん',
  description: [
    { text: 'ねこ' },
    { text: '社員', ruby: 'しゃいん' },
    { text: 'に、おもちゃ🧸をひろって ' },
    { text: 'ヒト' },
    { text: '社員', ruby: 'しゃいん' },
    { text: '🧑‍💼に ' },
    { text: '届', ruby: 'とど' },
    { text: 'ける ' },
    { text: '手順', ruby: 'てじゅん' },
    { text: 'を ' },
    { text: '教', ruby: 'おし' },
    { text: 'えてあげよう。' },
  ],
  // 開始・終了は編集領域に固定で用意する。ここには何度でも追加できる処理だけを置く。
  availableActions: ['move', 'pickUp', 'deliver'],
  start: { x: 0, y: 1 },
  toy: { x: 1, y: 1 },
  delivery: { x: 3, y: 1 },
  grid: { columns: 4, rows: 3 },
}
