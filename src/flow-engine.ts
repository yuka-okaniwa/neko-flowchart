import type { FlowEdge, FlowNode, RunState, StageDefinition } from './types'

export type ValidationResult = { ok: true; order: FlowNode[] } | { ok: false; invalidIds: string[]; message: string }

export function validateFlow(nodes: FlowNode[], edges: FlowEdge[]): ValidationResult {
  const starts = nodes.filter((node) => node.action === 'start')
  const ends = nodes.filter((node) => node.action === 'end')

  if (starts.length !== 1) {
    return { ok: false, invalidIds: starts.map((node) => node.id), message: '「はじめ」は ひとつだけ おいてね。' }
  }
  if (ends.length !== 1) {
    return { ok: false, invalidIds: ends.map((node) => node.id), message: '「おわり」は ひとつだけ おいてね。' }
  }

  const outgoing = new Map<string, FlowEdge[]>()
  const incoming = new Map<string, FlowEdge[]>()
  edges.forEach((edge) => {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge])
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge])
  })

  const invalidIds = nodes
    .filter((node) => {
      const inputs = incoming.get(node.id)?.length ?? 0
      const outputs = outgoing.get(node.id)?.length ?? 0
      return node.action === 'start' ? inputs > 0 || outputs !== 1 : node.action === 'end' ? inputs !== 1 || outputs > 0 : inputs !== 1 || outputs !== 1
    })
    .map((node) => node.id)

  if (invalidIds.length > 0) {
    return { ok: false, invalidIds, message: 'あかく なった ところを、やじるしで つないでね。' }
  }

  const order: FlowNode[] = []
  const seen = new Set<string>()
  let current = starts[0]
  while (current) {
    if (seen.has(current.id)) {
      return { ok: false, invalidIds: [...seen], message: 'おなじ ところを ぐるぐるしているよ。' }
    }
    seen.add(current.id)
    order.push(current)
    const nextEdge = outgoing.get(current.id)?.[0]
    if (!nextEdge) break
    const next = nodes.find((node) => node.id === nextEdge.to)
    if (!next) break
    current = next
  }

  if (order.at(-1)?.action !== 'end' || seen.size !== nodes.length) {
    return { ok: false, invalidIds: nodes.filter((node) => !seen.has(node.id)).map((node) => node.id), message: '「はじめ」から「おわり」まで、ひとつの みちに してね。' }
  }
  return { ok: true, order }
}

export function applyAction(state: RunState, action: FlowNode['action'], stage: StageDefinition): RunState {
  if (action === 'start') return state
  if (action === 'end') {
    return state.status === 'success'
      ? state
      : { ...state, status: 'error', message: 'おもちゃを とどける まえに、おわりに なっているよ。' }
  }
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
  if (state.cat.x !== stage.delivery.x || state.cat.y !== stage.delivery.y) return { ...state, status: 'error', message: 'ヒト社員の ばしょまで すすもう。' }
  if (!state.hasToy) return { ...state, status: 'error', message: 'さきに おもちゃを ひろおう。' }
  return { ...state, status: 'success', message: 'おもちゃを ヒト社員に とどけられたよ！' }
}
