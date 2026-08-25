import type { FlowEdge, FlowNode, RunState, StageDefinition } from './types'

export type ValidationResult = { ok: true; order: FlowNode[] } | { ok: false; invalidIds: string[]; message: string }

/** 判断図形では、選んだ答えに対応する矢印をたどる。 */
function nextEdge(node: FlowNode, edges: FlowEdge[], stage: StageDefinition) {
  const candidates = edges.filter((edge) => edge.from === node.id)
  return node.action === 'decision' ? candidates.find((edge) => edge.branch === stage.decision?.answer) : candidates[0]
}

/** すべての分かれ道が、途中で止まらず終了図形へ届くか確認する。 */
function reachesEnd(node: FlowNode, nodes: FlowNode[], edges: FlowEdge[], visiting: Set<string>): boolean {
  if (node.action === 'end') return true
  if (visiting.has(node.id)) return false
  const nextNodes = edges.filter((edge) => edge.from === node.id).map((edge) => nodes.find((candidate) => candidate.id === edge.to)).filter((candidate): candidate is FlowNode => Boolean(candidate))
  if (nextNodes.length === 0) return false
  const nextVisiting = new Set(visiting).add(node.id)
  return node.action === 'decision' ? nextNodes.every((candidate) => reachesEnd(candidate, nodes, edges, nextVisiting)) : reachesEnd(nextNodes[0], nodes, edges, nextVisiting)
}

/** 図形と矢印が、開始から終了まで実行できるフローチャートか検証する。 */
export function validateFlow(nodes: FlowNode[], edges: FlowEdge[], stage: StageDefinition): ValidationResult {
  const starts = nodes.filter((node) => node.action === 'start')
  const ends = nodes.filter((node) => node.action === 'end')
  if (starts.length !== 1 || ends.length !== 1) return { ok: false, invalidIds: [...starts, ...ends].map((node) => node.id), message: '「はじめ」と「おわり」は、ひとつずつ おいてね。' }

  const outgoing = new Map<string, FlowEdge[]>()
  const incoming = new Map<string, FlowEdge[]>()
  edges.forEach((edge) => { outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]); incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge]) })
  const invalidIds = nodes.filter((node) => {
    const inputs = incoming.get(node.id)?.length ?? 0
    const outputs = outgoing.get(node.id) ?? []
    if (node.action === 'start') return inputs > 0 || outputs.length !== 1
    if (node.action === 'end') return inputs < 1 || outputs.length > 0
    if (node.action === 'decision') {
      const branches = outputs.map((edge) => edge.branch)
      return inputs !== 1 || outputs.length !== 2 || !branches.includes('yes') || !branches.includes('no')
    }
    return inputs !== 1 || outputs.length !== 1
  }).map((node) => node.id)
  if (invalidIds.length > 0) return { ok: false, invalidIds, message: 'あかく なった ところを、やじるしで つないでね。' }
  if (!reachesEnd(starts[0], nodes, edges, new Set())) return { ok: false, invalidIds: nodes.map((node) => node.id), message: 'どちらの みちも「おわり」まで つないでね。' }

  const order: FlowNode[] = []
  const seen = new Set<string>()
  let current: FlowNode | undefined = starts[0]
  while (current) {
    if (seen.has(current.id)) return { ok: false, invalidIds: [...seen], message: 'おなじ ところを ぐるぐるしているよ。' }
    seen.add(current.id)
    order.push(current)
    if (current.action === 'end') break
    const edge = nextEdge(current, edges, stage)
    current = edge ? nodes.find((node) => node.id === edge.to) : undefined
  }
  return order.at(-1)?.action === 'end' ? { ok: true, order } : { ok: false, invalidIds: [...seen], message: '「はじめ」から「おわり」まで、みちを つないでね。' }
}

/** 1つの処理図形を実行し、猫・おもちゃ・成功失敗の状態を更新する。 */
export function applyAction(state: RunState, action: FlowNode['action'], stage: StageDefinition): RunState {
  if (action === 'start') return state
  if (state.afterDecision && state.heldItem === 'snack' && action !== 'eat') {
    return { ...state, status: 'error', message: 'おやつを たべよう。' }
  }
  if (action === 'decision') {
    if (stage.box && !state.boxOpened) return { ...state, status: 'error', message: 'まず はこを あけて、なかみを たしかめよう。' }
    return { ...state, afterDecision: true, message: stage.decision?.answer === 'yes' ? 'なかみは おもちゃだよ。「はい」の みちへ すすむよ。' : 'なかみは おやつだよ。「いいえ」の みちへ すすむよ。' }
  }
  if (action === 'end') return state.status === 'success' ? state : { ...state, status: 'error', message: 'はこの なかみを つかう まえに、おわりに なっているよ。' }
  if (action === 'move') {
    const next = { ...state.cat, x: state.cat.x + 1 }
    if (next.x >= stage.grid.columns) return { ...state, status: 'error', message: 'これいじょう すすむと、みちから はずれちゃうよ。' }
    return { ...state, cat: next, message: 'てくてく…' }
  }
  if (action === 'pickUp') {
    if (state.cat.x !== stage.toy.x || state.cat.y !== stage.toy.y) return { ...state, status: 'error', message: 'おもちゃが ある ばしょで「ひろう」を つかおう。' }
    if (state.hasToy) return { ...state, status: 'error', message: 'おもちゃは もう もっているよ。' }
    return { ...state, hasToy: true, message: 'おもちゃを ひろったよ！' }
  }
  if (action === 'pickUpSnack') {
    if (!stage.snack || state.cat.x !== stage.snack.x || state.cat.y !== stage.snack.y) return { ...state, status: 'error', message: 'おやつが ある ばしょで「ひろう」を つかおう。' }
    if (state.snackCollected) return { ...state, status: 'error', message: 'おやつは もう ひろったよ。' }
    return { ...state, heldItem: 'snack', snackCollected: true, message: 'おやつを ひろったよ！' }
  }
  if (action === 'openBox') {
    if (!stage.box || state.cat.x !== stage.box.x || state.cat.y !== stage.box.y) return { ...state, status: 'error', message: 'はこが ある ばしょで「あける」を つかおう。' }
    if (state.boxOpened) return { ...state, status: 'error', message: 'はこは もう あいているよ。' }
    const heldItem = stage.box.content
    return { ...state, boxOpened: true, heldItem, hasToy: heldItem === 'toy', message: 'はこを あけたよ。なかみを たしかめよう。' }
  }
  if (action === 'eat') {
    if (state.heldItem !== 'snack') return { ...state, status: 'error', message: 'おやつが ある ときに「たべる」を つかおう。' }
    return { ...state, heldItem: 'none', status: 'success', message: 'おやつを おいしく たべたよ！' }
  }
  if (state.cat.x !== stage.delivery.x || state.cat.y !== stage.delivery.y) return { ...state, status: 'error', message: 'ヒト社員の ばしょまで すすもう。' }
  if (!state.hasToy) return { ...state, status: 'error', message: 'さきに おもちゃを ひろおう。' }
  return { ...state, status: 'success', message: 'おもちゃを ヒト社員に とどけられたよ！' }
}
