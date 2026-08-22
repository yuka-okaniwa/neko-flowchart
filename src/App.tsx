import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { applyAction, validateFlow } from './flow-engine'
import { stages } from './stages'
import type { Action, FlowEdge, FlowNode, RunState, StageDefinition } from './types'
import './styles.css'

const NODE_WIDTH = 152
const NODE_HEIGHT = 70

const actionLabels: Record<Action, string> = {
  start: 'はじめ', end: 'おわり', move: '1マス すすむ', pickUp: 'おもちゃを ひろう', deliver: 'おもちゃを とどける',
}

/** 指定したステージを開始するための猫の初期状態を作成する。 */
function freshRunState(stage: StageDefinition): RunState {
  return { cat: { ...stage.start }, hasToy: false, status: 'idle', message: 'フローチャートを つくってから、「うごかす」を おしてね。' }
}

/** 配置した図形を一意に識別するIDを生成する。 */
function makeId(action: Action) {
  return `${action}-${crypto.randomUUID()}`
}

/** ホーム画面、フローチャート編集、実行結果を管理するアプリ本体。 */
export default function App() {
  const [activeStage, setActiveStage] = useState<StageDefinition>(stages[0])
  const [screen, setScreen] = useState<'home' | 'stage'>('home')
  const [showLegend, setShowLegend] = useState(false)
  const stage = activeStage
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [edges, setEdges] = useState<FlowEdge[]>([])
  const [invalidIds, setInvalidIds] = useState<string[]>([])
  const [runState, setRunState] = useState<RunState>(() => freshRunState(stages[0]))
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [newAction, setNewAction] = useState<Action | null>(null)
  const [newActionPreview, setNewActionPreview] = useState<{ x: number; y: number } | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  /** 開始と終了を対角に配置した、編集領域の初期図形を作成する。 */
  function initialNodes(): FlowNode[] {
    const canvas = canvasRef.current
    const width = canvas?.clientWidth ?? 600
    const height = canvas?.clientHeight ?? 530
    return [
      { id: 'start-fixed', action: 'start', x: 28, y: 28 },
      { id: 'end-fixed', action: 'end', x: Math.max(190, width - NODE_WIDTH - 28), y: Math.max(180, height - NODE_HEIGHT - 28) },
    ]
  }

  // 初回表示時に開始・終了の図形を編集領域へ配置する。
  useEffect(() => {
    setNodes(initialNodes())
  }, [])

  /** 画面上のポインター座標を、編集領域内の座標へ変換する。 */
  function canvasPoint(event: PointerEvent | ReactPointerEvent) {
    const box = canvasRef.current!.getBoundingClientRect()
    return { x: Math.max(0, Math.min(box.width - NODE_WIDTH, event.clientX - box.left)), y: Math.max(0, Math.min(box.height - NODE_HEIGHT, event.clientY - box.top)) }
  }

  // ドラッグ中の図形・新規図形・矢印プレビューを画面全体のポインター操作で更新する。
  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (dragging && canvasRef.current) {
        const point = canvasPoint(event)
        setNodes((current) => current.map((node) => node.id === dragging.id ? { ...node, x: point.x - dragging.offsetX, y: point.y - dragging.offsetY } : node))
      }
      if (newAction) setNewActionPreview({ x: event.clientX, y: event.clientY })
      if (connecting && canvasRef.current) setConnectionPreview(canvasPoint(event))
    }

    // 指やマウスを離した位置へ図形・矢印を確定し、ドラッグ状態を解除する。
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
      setDragging(null); setNewAction(null); setNewActionPreview(null); setConnecting(null); setConnectionPreview(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [dragging, newAction, connecting, edges])

  /** フローチャートを検証し、正しければ猫の行動を順に実行する。 */
  function runFlow() {
    const result = validateFlow(nodes, edges)
    if (!result.ok) {
      setInvalidIds(result.invalidIds)
      setRunState({ ...freshRunState(stage), status: 'error', message: result.message })
      return
    }
    setInvalidIds([])
    setRunState({ ...freshRunState(stage), status: 'running', message: 'ねこ社員が うごきだしたよ！' })
    let state: RunState = { ...freshRunState(stage), status: 'running' }
    result.order.forEach((node, index) => {
      window.setTimeout(() => {
        if (state.status === 'error' || state.status === 'success') return
        state = applyAction(state, node.action, stage)
        setRunState(state)
      }, index * 900)
    })
  }

  /** 現在のステージを開始直後の状態へ戻す。 */
  function reset() {
    setNodes(initialNodes()); setEdges([]); setInvalidIds([]); setRunState(freshRunState(stage))
  }

  /** 指定した図形と、その図形につながる矢印を削除する。 */
  function deleteNode(id: string) {
    setNodes((current) => current.filter((node) => node.id !== id))
    setEdges((current) => current.filter((edge) => edge.from !== id && edge.to !== id))
    setInvalidIds((current) => current.filter((invalidId) => invalidId !== id))
  }

  /** 指定した矢印だけを削除する。 */
  function deleteEdge(id: string) {
    setEdges((current) => current.filter((edge) => edge.id !== id))
  }

  /** 選択したステージを初期化して開き、記号説明を表示する。 */
  function openStage(nextStage: StageDefinition) {
    setActiveStage(nextStage)
    setNodes(initialNodes())
    setEdges([])
    setInvalidIds([])
    setRunState(freshRunState(nextStage))
    setScreen('stage')
    setShowLegend(true)
  }

  if (screen === 'home') {
    return (
      <main className="app-shell home-screen">
        <header className="topbar"><div className="logo"><img src="/images/company-logo.png" alt="会社ロゴ" /></div></header>
        <section className="home-hero"><span>🐱</span><h1>ねこ社員の フローチャート</h1><p>ねこ社員の お<ruby>仕事<rt>しごと</rt></ruby>を、フローチャートで たすけよう！</p></section>
        <section className="stage-select"><h2>ステージを えらぼう</h2><div className="stage-cards">{stages.map((availableStage, index) => <button key={availableStage.id} className="stage-card" onClick={() => openStage(availableStage)}><span className="stage-card-number">{index + 1}</span><span className="difficulty">{availableStage.difficulty}</span><strong>{availableStage.title}</strong><small>タップして はじめる</small></button>)}</div></section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar"><div className="logo"><img src="/images/company-logo.png" alt="会社ロゴ" /></div><div className="stage-title"><span className="difficulty">{stage.difficulty}</span><h1>ステージ {stages.findIndex((availableStage) => availableStage.id === stage.id) + 1}　{stage.title}</h1></div><div className="header-actions"><button className="home-button" onClick={() => setScreen('home')}>ホームに戻る</button><button className="reset-button" onClick={reset}><ruby>最初<rt>さいしょ</rt></ruby>から</button></div></header>
      <section className="intro"><div className="cat-portrait">🐱</div><p className="stage-description">{stage.description.map((part, index) => part.ruby ? <ruby key={index}>{part.text}<rt>{part.ruby}</rt></ruby> : <span className="stage-description" key={index}>{part.text}</span>)}</p><span>ヒント：おもちゃを ひろってから、ヒト社員に とどけよう。</span></section>
      <div className="game-layout">
        <aside className="palette panel"><h2><ruby>使<rt>つか</rt></ruby>う <ruby>記号<rt>きごう</rt></ruby></h2><p>ドラッグしてね</p>{stage.availableActions.map((action) => <button key={action} className={`palette-node ${action}`} onPointerDown={(event) => { event.preventDefault(); setNewAction(action); setNewActionPreview({ x: event.clientX, y: event.clientY }) }}>{actionLabels[action]}<small><ruby>処理<rt>しょり</rt></ruby></small></button>)}</aside>
        <section className="editor panel"><div className="editor-heading"><h2>フローチャート</h2><div className="editor-actions">{edges.length > 0 && <p className="arrow-help">やじるしを タッチすると けせるよ</p>}<button className="legend-button" onClick={() => setShowLegend(true)}><ruby>記号<rt>きごう</rt></ruby>の <ruby>説明<rt>せつめい</rt></ruby></button><button className="run-button" onClick={runFlow} disabled={runState.status === 'running'}>▶ うごかす</button></div></div><div ref={canvasRef} className="canvas">
          <svg className="edge-layer" aria-label="やじるしを さわると けせます">{edges.map((edge) => { const from = nodes.find((node) => node.id === edge.from); const to = nodes.find((node) => node.id === edge.to); if (!from || !to) return null; const x1 = from.x + NODE_WIDTH / 2; const y1 = from.y + NODE_HEIGHT; const x2 = to.x + NODE_WIDTH / 2; const y2 = to.y; return <g key={edge.id}><line className="edge-hit-area" x1={x1} y1={y1} x2={x2} y2={y2} onPointerDown={(event) => { event.stopPropagation(); deleteEdge(edge.id) }} /><line className="edge-visible" x1={x1} y1={y1} x2={x2} y2={y2} markerEnd="url(#arrow)" /></g> })}{connecting && connectionPreview && (() => { const from = nodes.find((node) => node.id === connecting); return from && <line className="edge-preview" x1={from.x + NODE_WIDTH / 2} y1={from.y + NODE_HEIGHT} x2={connectionPreview.x} y2={connectionPreview.y} markerEnd="url(#arrow-preview)" /> })()}<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker><marker id="arrow-preview" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs></svg>
          {nodes.map((node) => <div key={node.id} className={`flow-node ${node.action} ${invalidIds.includes(node.id) ? 'invalid' : ''}`} style={{ left: node.x, top: node.y }} onPointerDown={(event) => { if ((event.target as HTMLElement).classList.contains('connector') || (event.target as HTMLElement).classList.contains('delete-node')) return; event.preventDefault(); setDragging({ id: node.id, offsetX: event.nativeEvent.offsetX, offsetY: event.nativeEvent.offsetY }) }}>{node.action !== 'start' && node.action !== 'end' && <button className="delete-node" aria-label={`${actionLabels[node.action]}を けす`} onPointerDown={(event) => { event.stopPropagation(); deleteNode(node.id) }} />}{node.action !== 'start' && <span className="connector input" data-input-id={node.id} title="ここへつなぐ" />}{actionLabels[node.action]}{node.action !== 'end' && <span className="connector output" onPointerDown={(event) => { event.stopPropagation(); event.preventDefault(); setConnecting(node.id); setConnectionPreview(canvasPoint(event)) }} title="ここからつなぐ" />}</div>)}
          {connecting && <div className="connection-hint">つなぎたい きごうの ● まで ドラッグ！</div>}
          {nodes.every((node) => node.action === 'start' || node.action === 'end') && <div className="empty-canvas">左の きごうを、ここに ドラッグしてね。</div>}
        </div></section>
        <section className="board panel"><h2>ねこ社員のお<ruby>仕事<rt>しごと</rt></ruby></h2><div className="grid" style={{ gridTemplateColumns: `repeat(${stage.grid.columns}, 1fr)` }}>{Array.from({ length: stage.grid.columns }, (_, x) => { const y = stage.start.y; const catHere = runState.cat.x === x && runState.cat.y === y; const toyHere = stage.toy.x === x && stage.toy.y === y && !runState.hasToy; const targetHere = stage.delivery.x === x && stage.delivery.y === y; return <div key={x} className={`cell ${catHere && toyHere ? 'cat-with-toy' : ''}`}>{targetHere && <span className="target">🧑‍💼</span>}{toyHere && <span className="toy">🧸</span>}{catHere && <span className={`cat ${runState.status === 'success' ? 'happy' : runState.status === 'error' ? 'confused' : ''}`}>🐱</span>}</div> })}</div><div className={`speech ${runState.status}`}><span>🐱</span><p>{runState.message}</p></div></section>
      </div>
      {newAction && newActionPreview && <div className={`flow-node drag-preview ${newAction}`} style={{ left: newActionPreview.x, top: newActionPreview.y }}>{actionLabels[newAction]}</div>}
      {showLegend && <div className="legend-overlay" role="dialog" aria-modal="true" aria-labelledby="legend-title"><div className="legend-modal"><button className="legend-close" aria-label="説明をとじる" onClick={() => setShowLegend(false)} /><h2 id="legend-title"><ruby>記号<rt>きごう</rt></ruby>の <ruby>説明<rt>せつめい</rt></ruby></h2><p>フローチャートは、きごうと やじるしで <ruby>手順<rt>てじゅん</rt></ruby>を あらわすよ。</p><div className="legend-items"><div><span className="legend-symbol terminal">はじめ／おわり</span><p><ruby>端子<rt>たんし</rt></ruby>：ながれの はじまりと おわり。</p></div><div><span className="legend-symbol process"><ruby>処理<rt>しょり</rt></ruby></span><p><ruby>処理<rt>しょり</rt></ruby>：ねこ社員に してほしいこと。</p></div><div><span className="legend-arrow">→</span><p>やじるし：つぎに すすむ みち。</p></div></div><button className="legend-ok" onClick={() => setShowLegend(false)}>わかった！</button></div></div>}
      {runState.status === 'success' && <div className="success-overlay"><div><span>🎉</span><h2>クリア！ おめでとう！</h2><p>ねこ社員が おもちゃを とどけられたよ。</p><button onClick={reset}>もういちど あそぶ</button></div></div>}
    </main>
  )
}
