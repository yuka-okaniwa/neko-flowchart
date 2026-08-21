import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

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

  function initialNodes(): FlowNode[] {
    const canvas = canvasRef.current
    const width = canvas?.clientWidth ?? 600
    const height = canvas?.clientHeight ?? 530
    return [
      { id: 'start-fixed', action: 'start', x: 28, y: 28 },
      { id: 'end-fixed', action: 'end', x: Math.max(190, width - NODE_WIDTH - 28), y: Math.max(180, height - NODE_HEIGHT - 28) },
    ]
  }

  useEffect(() => {
    setNodes(initialNodes())
  }, [])

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
    setNodes(initialNodes()); setEdges([]); setInvalidIds([]); setRunState(freshRunState())
  }

  function deleteNode(id: string) {
    setNodes((current) => current.filter((node) => node.id !== id))
    setEdges((current) => current.filter((edge) => edge.from !== id && edge.to !== id))
    setInvalidIds((current) => current.filter((invalidId) => invalidId !== id))
  }

  function deleteEdge(id: string) {
    setEdges((current) => current.filter((edge) => edge.id !== id))
  }

  return (
    <main className="app-shell">
      <header className="topbar"><div className="logo"><img src="/images/company-logo.png" alt="会社ロゴ" /></div><div className="stage-title"><span className="difficulty">{stage.difficulty}</span><h1>ステージ 1　{stage.title}</h1></div><button className="reset-button" onClick={reset}><ruby>最初<rt>さいしょ</rt></ruby>から</button></header>
      <section className="intro"><div className="cat-portrait">🐱</div><p>{stage.description.map((part, index) => part.ruby ? <ruby key={index}>{part.text}<rt>{part.ruby}</rt></ruby> : <span key={index}>{part.text}</span>)}</p><span>ヒント：おやつを ひろってから、とどけよう。</span></section>
      <div className="game-layout">
        <aside className="palette panel"><h2><ruby>使<rt>つか</rt></ruby>う <ruby>記号<rt>きごう</rt></ruby></h2><p>ドラッグしてね</p>{stage.availableActions.map((action) => <button key={action} className={`palette-node ${action}`} onPointerDown={(event) => { event.preventDefault(); setNewAction(action) }}>{actionLabels[action]}<small><ruby>処理<rt>しょり</rt></ruby></small></button>)}</aside>
        <section className="editor panel"><div className="editor-heading"><h2>フローチャート</h2><button className="run-button" onClick={runFlow} disabled={runState.status === 'running'}>▶ うごかす</button></div><div ref={canvasRef} className="canvas">
          <svg className="edge-layer" aria-label="やじるしを さわると けせます">{edges.map((edge) => { const from = nodes.find((node) => node.id === edge.from); const to = nodes.find((node) => node.id === edge.to); if (!from || !to) return null; const x1 = from.x + NODE_WIDTH / 2; const y1 = from.y + NODE_HEIGHT; const x2 = to.x + NODE_WIDTH / 2; const y2 = to.y; return <g key={edge.id}><line className="edge-hit-area" x1={x1} y1={y1} x2={x2} y2={y2} onPointerDown={(event) => { event.stopPropagation(); deleteEdge(edge.id) }} /><line className="edge-visible" x1={x1} y1={y1} x2={x2} y2={y2} markerEnd="url(#arrow)" /></g> })}<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs></svg>
          {nodes.map((node) => <div key={node.id} className={`flow-node ${node.action} ${invalidIds.includes(node.id) ? 'invalid' : ''}`} style={{ left: node.x, top: node.y }} onPointerDown={(event) => { if ((event.target as HTMLElement).classList.contains('connector') || (event.target as HTMLElement).classList.contains('delete-node')) return; event.preventDefault(); setDragging({ id: node.id, offsetX: event.nativeEvent.offsetX, offsetY: event.nativeEvent.offsetY }) }}>{node.action !== 'start' && node.action !== 'end' && <button className="delete-node" aria-label={`${actionLabels[node.action]}を けす`} onPointerDown={(event) => { event.stopPropagation(); deleteNode(node.id) }} />}<span className="connector input" data-input-id={node.id} title="ここへつなぐ" />{actionLabels[node.action]}<span className="connector output" onPointerDown={(event) => { event.stopPropagation(); event.preventDefault(); setConnecting(node.id) }} title="ここからつなぐ" /></div>)}
          {connecting && <div className="connection-hint">つなぎたい きごうの ● まで ドラッグ！</div>}
          {nodes.every((node) => node.action === 'start' || node.action === 'end') && <div className="empty-canvas">左の きごうを、ここに ドラッグしてね。</div>}
        </div></section>
        <section className="board panel"><h2>ねこ社員の <ruby>仕事<rt>しごと</rt></ruby></h2><div className="grid" style={{ gridTemplateColumns: `repeat(${stage.grid.columns}, 1fr)` }}>{Array.from({ length: stage.grid.columns * stage.grid.rows }, (_, index) => { const x = index % stage.grid.columns; const y = Math.floor(index / stage.grid.columns); const catHere = runState.cat.x === x && runState.cat.y === y; const snackHere = stage.snack.x === x && stage.snack.y === y && !runState.hasSnack; const targetHere = stage.delivery.x === x && stage.delivery.y === y; return <div key={index} className="cell">{targetHere && <span className="target">🏠</span>}{snackHere && <span className="snack">🍪</span>}{catHere && <span className={`cat ${runState.status === 'success' ? 'happy' : ''}`}>🐱</span>}</div> })}</div><div className={`speech ${runState.status}`}><span>🐱</span><p>{runState.message}</p></div></section>
      </div>
      {runState.status === 'success' && <div className="success-overlay"><div><span>🎉</span><h2>クリア！ おめでとう！</h2><p>ねこ社員が おやつを とどけられたよ。</p><button onClick={reset}>もういちど あそぶ</button></div></div>}
    </main>
  )
}
