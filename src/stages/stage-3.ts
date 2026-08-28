import type { StageDefinition } from '../types'

/** 反復端子を使い、おやつを食べる処理を繰り返すステージ。 */
export const stage3: StageDefinition = {
  id: 'loop-tutorial',
  title: 'くりかえしを つかおう',
  difficulty: 'むずかしい',
  description: [
    { text: 'ねこ' },
    { text: '社員', ruby: 'しゃいん' },
    { text: 'に、おやつを たべる ' },
    { text: '手順', ruby: 'てじゅん' },
    { text: 'を おしえてあげよう。' },
  ],
  availableActions: ['loopStart', 'move', 'eat', 'loopEnd'],
  start: { x: 0, y: 0 },
  toy: { x: -1, y: -1 },
  snacks: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
  delivery: { x: -1, y: -1 },
  grid: { columns: 4, rows: 1 },
  hint: '1マス すすんで おやつを たべるところを、ループ記号で かこんでね。',
  loop: {
    repeatUntil: 3,
    taskLabel: 'おやつを たべる',
    taskEmoji: '🐟',
  },
}
