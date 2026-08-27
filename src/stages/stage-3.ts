import type { StageDefinition } from '../types'

/** くり返しの矢印と判断図形を、案内に沿って組み立てるステージ。 */
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
  tutorial: {
    steps: [
      { type: 'place', action: 'loopStart', message: '①「3回 くりかえす」を、ひかっている ばしょへ ドラッグしてね。' },
      { type: 'connect', from: 'start', to: 'loopStart', message: '② はじめから、ループの はじまりへ つないでね。' },
      { type: 'place', action: 'move', message: '③「1マス すすむ」を、ひかっている ばしょへ ドラッグしてね。' },
      { type: 'connect', from: 'loopStart', to: 'move', message: '④ ループの はじまりから、「1マス すすむ」へ つないでね。' },
      { type: 'place', action: 'eat', message: '⑤「おやつを たべる」を、ひかっている ばしょへ ドラッグしてね。' },
      { type: 'connect', from: 'move', to: 'eat', message: '⑥「1マス すすむ」から、「おやつを たべる」へ つないでね。' },
      { type: 'place', action: 'loopEnd', message: '⑦「ここまで くりかえす」を、ひかっている ばしょへ ドラッグしてね。' },
      { type: 'connect', from: 'eat', to: 'loopEnd', message: '⑧ おやつを たべたら、ループの おわりへ つないでね。' },
      { type: 'connect', from: 'loopEnd', to: 'end', message: '⑨ ループの おわりから、おわりへ つないでね。' },
      { type: 'run', message: '⑩「うごかす」を おして、くりかえしを みてみよう！' },
    ],
  },
}
