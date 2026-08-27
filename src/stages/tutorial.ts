import type { StageDefinition } from '../types'

export const tutorial: StageDefinition = {
  id: 'how-to-play',
  title: 'あそびかた',
  difficulty: 'あそびかた',
  description: [{ text: 'ねこ' }, { text: '社員', ruby: 'しゃいん' }, { text: 'に、おやつを ひろって たべる ' }, { text: '手順', ruby: 'てじゅん' }, { text: 'を おしえてね。' }],
  availableActions: ['move', 'pickUpSnack', 'eat'],
  start: { x: 0, y: 1 },
  toy: { x: -1, y: -1 },
  snack: { x: 1, y: 1 },
  delivery: { x: -1, y: -1 },
  grid: { columns: 3, rows: 3 },
  hint: 'がめんの あんないを みながら、いっしょに やってみよう。',
  tutorial: {
    steps: [
      { type: 'place', action: 'move', message: '①「1マス すすむ」を、ひかっている ばしょ（フローチャート）へ ドラッグしてね。' },
      { type: 'connect', from: 'start', to: 'move', message: '② はじめの ● から、「1マス すすむ」の ● へ つないでね。' },
      { type: 'place', action: 'pickUpSnack', message: '③「おやつを ひろう」を、ひかっている ばしょ（フローチャート）へ ドラッグしてね。' },
      { type: 'connect', from: 'move', to: 'pickUpSnack', message: '④「1マス すすむ」から、「おやつを ひろう」へ つないでね。' },
      { type: 'place', action: 'eat', message: '⑤「おやつを たべる」を、ひかっている ばしょ（フローチャート）へ ドラッグしてね。' },
      { type: 'connect', from: 'pickUpSnack', to: 'eat', message: '⑥「おやつを ひろう」から、「おやつを たべる」へ つないでね。' },
      { type: 'connect', from: 'eat', to: 'end', message: '⑦「おやつを たべる」から、おわりへ つないでね。' },
      { type: 'run', message: '⑧「うごかす」を おしてみよう！' },
    ],
  },
}
