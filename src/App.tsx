import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { applyAction, validateFlow } from './flow-engine'
import { stages } from './stages'
import type { Action, FlowEdge, FlowNode, RunState } from './types'
import './styles.css'

const stage = stages[0]
const NODE_WIDTH = 152
const NODE_HEIGHT = 70

const actionLabels: Record<Action, string> = {
  start: 'はじめ', end: 'おわり', move: '1マス すすむ', pickUp: 'おやつを ひろう', deliver: 'おやつを とどける',
}

function freshRunState(): RunState {
  return { cat: { ...stage.start }, hasSnack: false, status: 'idle', message: 'フローチャートを つくってから、「うごかす」を おしてね。' }
}

function makeId(action: Action) {
  return `${action}-${crypto.randomUUID()}`
}

export default function App() {
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [edges, setEdges] = useState<FlowEdge[]>([])
  const [invalidIds, setInvalidIds] = useState<string[]>([])
  const [runState, setRunState] = useState<RunState>(freshRunState)
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [newAction, setNewAction] = useState<Action | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const actionCount = useMemo(() => nodes.reduce<Record<Action, number>>((counts, node) => ({ ...counts, [node.action]: (counts[node.action] ?? 0) + 1 }), {} as Record<Action, number>), [nodes])
  const allowedCount: Partial<Record<Action, number>> = { start: 1, end: 1, move: 2, pickUp: 1, deliver: 1 }

  function canvasPoint(event: PointerEvent | ReactPointerEvent) {
    const box = canvasRef.current!.getBoundingClientRect()
    return { x: Math.max(0, Math.min(box.width - NODE_WIDTH, event.clientX - box.left)), y: Math.max(0, Math.min(box.height - NODE_HEIGHT, event.clientY - box.top)) }
  }

  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (!dragging || !canvasRef.current) return
      const point = canvasPoint(event)
      setNodes((current) => current.map((node) => node.id === dragging.id ? { ...node, x: point.x - dragging.offsetX, y: point.y - dragging.offsetY } : node))
    }
    function onUp(event: PointerEvent) {
      if (newAction && canvasRef.current) {
        const box = canvasRef.current.getBoundingClientRect()
        const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom
        if (inside) {
          const point = canvasPoint(event)
          setNodes((current) => [...current, { id: makeId(newAction), action: newAction, x: point.x, y: point.y }])
        }
      }
      if (connecting) {
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-input-id]')?.dataset.inputId
        if (target && target !== connecting && !edges.some((edge) => edge.from === connecting || edge.to === target)) {
          setEdges((current) => [...current, { id: `${connecting}-${target}`, from: connecting, to: target }])
        }
      }
      setDragging(null); setNewAction(null); setConnecting(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [dragging, newAction, connecting, edges])

  function runFlow() {
    const result = validateFlow(nodes, edges)
    if (!result.ok) {
      setInvalidIds(result.invalidIds)
      setRunState({ ...freshRunState(), status: 'error', message: result.message })
      return
    }
    setInvalidIds([])
    setRunState({ ...freshRunState(), status: 'running', message: 'ねこ社員が うごきだしたよ！' })
    let state: RunState = { ...freshRunState(), status: 'running' }
    result.order.forEach((node, index) => {
      window.setTimeout(() => {
        if (state.status === 'error' || state.status === 'success') return
        state = applyAction(state, node.action, stage)
        setRunState(state)
      }, index * 900)
    })
  }

  function reset() {
    setNodes([]); setEdges([]); setInvalidIds([]); setRunState(freshRunState())
  }

  return (
    <main className="app-shell">
      <header className="topbar"><div className="logo"><span>🐾</span> NEKO WORKS</div><div className="stage-title"><span className="difficulty">{stage.difficulty}</span><h1>ステージ 1　{stage.title}</h1></div><button className="reset-button" onClick={reset}>さいしょから</button></header>
      <section className="intro"><div className="cat-portrait">🐱</div><p>{stage.description}</p><span>ヒント：おやつを ひろってから、とどけよう。</span></section>
      <div className="game-layout">
        <aside className="palette panel"><h2>つかう きごう</h2><p>ドラッグして おいてね</p>{stage.availableActions.map((action) => <button key={action} className={`palette-node ${action}`} disabled={(allowedCount[action] ?? 0) <= (actionCount[action] ?? 0)} onPointerDown={(event) => { event.preventDefault(); setNewAction(action) }}>{actionLabels[action]}<small>{action === 'start' || action === 'end' ? 'たんし' : 'しょり'}</small></button>)}</aside>
        <section className="editor panel"><div className="editor-heading"><h2>フローチャート</h2><button className="run-button" onClick={runFlow} disabled={runState.status === 'running'}>▶ うごかす</button></div><div ref={canvasRef} className="canvas">
          <svg className="edge-layer" aria-hidden="true">{edges.map((edge) => { const from = nodes.find((node) => node.id === edge.from); const to = nodes.find((node) => node.id === edge.to); if (!from || !to) return null; return <line key={edge.id} x1={from.x + NODE_WIDTH / 2} y1={from.y + NODE_HEIGHT} x2={to.x + NODE_WIDTH / 2} y2={to.y} markerEnd="url(#arrow)" /> })}<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs></svg>
          {nodes.map((node) => <div key={node.id} className={`flow-node ${node.action} ${invalidIds.includes(node.id) ? 'invalid' : ''}`} style={{ left: node.x, top: node.y }} onPointerDown={(event) => { if ((event.target as HTMLElement).classList.contains('connector')) return; event.preventDefault(); setDragging({ id: node.id, offsetX: event.nativeEvent.offsetX, offsetY: event.nativeEvent.offsetY }) }}><span className="connector input" data-input-id={node.id} title="ここへつなぐ" />{actionLabels[node.action]}<span className="connector output" onPointerDown={(event) => { event.stopPropagation(); event.preventDefault(); setConnecting(node.id) }} title="ここからつなぐ" /></div>)}
          {connecting && <div className="connection-hint">つなぎたい きごうの ● まで ドラッグ！</div>}
          {nodes.length === 0 && <div className="empty-canvas">左の きごうを ドラッグして、ここに おいてね。</div>}
        </div></section>
        <section className="board panel"><h2>ねこ社員の おしごと</h2><div className="grid" style={{ gridTemplateColumns: `repeat(${stage.grid.columns}, 1fr)` }}>{Array.from({ length: stage.grid.columns * stage.grid.rows }, (_, index) => { const x = index % stage.grid.columns; const y = Math.floor(index / stage.grid.columns); const catHere = runState.cat.x === x && runState.cat.y === y; const snackHere = stage.snack.x === x && stage.snack.y === y && !runState.hasSnack; const targetHere = stage.delivery.x === x && stage.delivery.y === y; return <div key={index} className="cell">{targetHere && <span className="target">🏠</span>}{snackHere && <span className="snack">🍪</span>}{catHere && <span className={`cat ${runState.status === 'success' ? 'happy' : ''}`}>🐱</span>}</div> })}</div><div className={`speech ${runState.status}`}><span>🐱</span><p>{runState.message}</p></div></section>
      </div>
      {runState.status === 'success' && <div className="success-overlay"><div><span>🎉</span><h2>クリア！ おめでとう！</h2><p>ねこ社員が おやつを とどけられたよ。</p><button onClick={reset}>もういちど あそぶ</button></div></div>}
    </main>
  )
}
