import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { applyAction, nextFlowNode, validateFlow } from './flow-engine'
import { catEmployees } from './cat-employees'
import { FlowchartGuide } from './FlowchartGuide'
import { stages } from './stages'
import { canConnectTutorialNodes, canPlaceTutorialAction, getCurrentTutorialStep, isTutorialConnectionTarget, tutorialMessage } from './tutorial'
import type { Action, FlowEdge, FlowNode, RunState, StageDefinition } from './types'
import './styles.css'

const NODE_WIDTH = 176
const NODE_HEIGHT = 70
const DECISION_YES_CONNECTOR = { x: NODE_WIDTH / 2, y: 80 }
const DECISION_NO_CONNECTOR = { x: NODE_WIDTH + 10, y: 28 }
let nodeSequence = 0

const actionLabels: Record<Action, string> = {
  start: 'はじめ', end: 'おわり', move: '1マス すすむ', pickUp: 'おもちゃを\nひろう', pickUpSnack: 'おやつを\nひろう', deliver: 'おもちゃを\nとどける', decision: 'おもちゃを\nみつけた？', openBox: 'はこを\nあける', eat: 'おやつを\nたべる', loopStart: '3回\nくりかえす', loopEnd: 'ここまで\nくりかえす',
}

/** 指定したステージを開始するための猫の初期状態を作成する。 */
function freshRunState(stage: StageDefinition): RunState {
  return { cat: { ...stage.start }, hasToy: false, snackCollected: false, heldItem: 'none', boxOpened: false, boxContent: stage.box?.content ?? null, afterDecision: false, loopCount: 0, status: 'idle', message: 'フローチャートを つくってから、「うごかす」を おしてね。' }
}

/** 配置した図形を一意に識別するIDを生成する。 */
function makeId(action: Action) {
  // crypto.randomUUID() は HTTPS / localhost 以外では使えないため、
  // ローカルIPを HTTP で開く端末でも動く連番ベースのIDを使用する。
  nodeSequence += 1
  return `${action}-${Date.now().toString(36)}-${nodeSequence}`
}

/** ホーム画面、フローチャート編集、実行結果を管理するアプリ本体。 */
export default function App() {
  // 将来の猫選択UIでは、このIDを選択した猫のIDへ更新する。
  const [selectedCatId] = useState('furom')
  const selectedCat = catEmployees.find((catEmployee) => catEmployee.id === selectedCatId) ?? catEmployees[0]
  const introCat = catEmployees.find((catEmployee) => catEmployee.id === 'mii') ?? selectedCat
  const [activeStage, setActiveStage] = useState<StageDefinition>(stages[0])
  const [screen, setScreen] = useState<'home' | 'stage' | 'guide'>('home')
  const [showLegend, setShowLegend] = useState(false)
  const stage = activeStage
  // ステージごとの判断文がある場合は、判断図形の表示に使う。
  const labelFor = (action: Action) => action === 'decision' && stage.decision ? stage.decision.question : actionLabels[action]
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [edges, setEdges] = useState<FlowEdge[]>([])
  const [invalidIds, setInvalidIds] = useState<string[]>([])
  const [runState, setRunState] = useState<RunState>(() => freshRunState(stages[0]))
  const [errorShakeKey, setErrorShakeKey] = useState(0)
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [newAction, setNewAction] = useState<Action | null>(null)
  const [newActionPreview, setNewActionPreview] = useState<{ x: number; y: number } | null>(null)
  const [connecting, setConnecting] = useState<{ id: string; branch?: 'yes' | 'no' } | null>(null)
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

  // チュートリアルの進行判定は専用モジュールへ集約し、画面では結果だけを使う。
  const tutorialStep = getCurrentTutorialStep(stage, nodes, edges)

  /** チュートリアルの案内に合う記号だけを、編集領域へ追加する。 */
  function startNewAction(event: ReactPointerEvent, action: Action) {
    event.preventDefault()
    if (!canPlaceTutorialAction(tutorialStep, action)) {
      setRunState({ ...freshRunState(stage), message: 'いまは、ひかっている きごうを つかってみよう。' })
      return
    }
    setNewAction(action)
    setNewActionPreview({ x: event.clientX, y: event.clientY })
  }

  // 初回表示時に開始・終了の図形を編集領域へ配置する。
  useEffect(() => {
    setNodes(initialNodes())
  }, [])

  // ステージ画面の表示後に実際のキャンバス幅を取得し、開始・終了の位置を収め直す。
  useEffect(() => {
    if (screen !== 'stage') return
    const frameId = window.requestAnimationFrame(() => setNodes(initialNodes()))
    return () => window.cancelAnimationFrame(frameId)
  }, [screen])

  /** 画面上のポインター座標を、編集領域内の座標へ変換する。 */
  function canvasPoint(event: PointerEvent | ReactPointerEvent) {
    const box = canvasRef.current!.getBoundingClientRect()
    return { x: Math.max(0, Math.min(box.width, event.clientX - box.left)), y: Math.max(0, Math.min(box.height, event.clientY - box.top)) }
  }

  /** ポインター位置を中心にして、編集領域からはみ出さない図形の配置座標を作る。 */
  function nodePosition(point: { x: number; y: number }) {
    const canvas = canvasRef.current!
    return {
      x: Math.max(0, Math.min(canvas.clientWidth - NODE_WIDTH, point.x - NODE_WIDTH / 2)),
      y: Math.max(0, Math.min(canvas.clientHeight - NODE_HEIGHT, point.y - NODE_HEIGHT / 2)),
    }
  }

  // ドラッグ中の図形・新規図形・矢印プレビューを画面全体のポインター操作で更新する。
  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (dragging && canvasRef.current) {
        const point = canvasPoint(event)
        setNodes((current) => current.map((node) => node.id === dragging.id ? {
          ...node,
          x: Math.max(0, Math.min(canvasRef.current!.clientWidth - NODE_WIDTH, point.x - dragging.offsetX)),
          y: Math.max(0, Math.min(canvasRef.current!.clientHeight - NODE_HEIGHT, point.y - dragging.offsetY)),
        } : node))
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
          const position = nodePosition(point)
          setNodes((current) => [...current, { id: makeId(newAction), action: newAction, ...position }])
        }
      }
      if (connecting) {
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-input-id]')?.dataset.inputId
        const source = connecting && nodes.find((node) => node.id === connecting.id)
        const targetNode = target ? nodes.find((node) => node.id === target) : undefined
        const sourceHasOutput = source?.action === 'decision'
          ? edges.some((edge) => edge.from === connecting?.id && edge.branch === connecting?.branch)
          : edges.some((edge) => edge.from === connecting?.id)
        const targetHasInput = targetNode?.action === 'end' ? false : edges.some((edge) => edge.to === target)
        const matchesTutorialStep = canConnectTutorialNodes(tutorialStep, source, targetNode, connecting.branch)
        if (target && source && target !== connecting.id && !sourceHasOutput && !targetHasInput && matchesTutorialStep) {
          setEdges((current) => [...current, { id: `${connecting.id}-${connecting.branch ?? 'next'}-${target}`, from: connecting.id, to: target, branch: connecting.branch }])
        } else if (tutorialStep && !matchesTutorialStep) {
          setRunState({ ...freshRunState(stage), message: 'いまは、ひかっている ● どうしを つないでみよう。' })
        }
      }
      setDragging(null); setNewAction(null); setNewActionPreview(null); setConnecting(null); setConnectionPreview(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [dragging, newAction, connecting, edges, nodes, stage, tutorialStep])

  /** フローチャートを検証し、正しければ猫の行動を順に実行する。 */
  function runFlow() {
    if (tutorialStep?.type !== undefined && tutorialStep.type !== 'run') {
      setRunState({ ...freshRunState(stage), message: 'いまは、がめんの あんないを みながら つくってみよう。' })
      setErrorShakeKey((current) => current + 1)
      return
    }
    // 箱があるステージでは、実行するたびに中身と判断の答えを決める。
    const boxContent = Math.random() < 0.5 ? 'toy' : 'snack'
    const runStage: StageDefinition = stage.box && stage.decision
      ? { ...stage, box: { ...stage.box, content: boxContent }, decision: { ...stage.decision, answer: boxContent === 'toy' ? 'yes' : 'no' } }
      : stage
    const result = validateFlow(nodes, edges, runStage)
    if (!result.ok) {
      setInvalidIds(result.invalidIds)
      setRunState({ ...freshRunState(stage), status: 'error', message: result.message })
      setErrorShakeKey((current) => current + 1)
      return
    }
    setInvalidIds([])
    setRunState({ ...freshRunState(runStage), status: 'running', message: 'ねこ社員が うごきだしたよ！' })
    let state: RunState = { ...freshRunState(runStage), status: 'running' }
    let currentNode = nodes.find((node) => node.action === 'start')

    // 判断結果によって同じ記号へ戻るループにも対応して、1つずつ実行する。
    function runNextNode() {
      if (!currentNode || state.status === 'error' || state.status === 'success') return
      state = applyAction(state, currentNode.action, runStage)
      setRunState(state)
      if (state.status === 'error') {
        setErrorShakeKey((current) => current + 1)
        return
      }
      currentNode = nextFlowNode(currentNode, nodes, edges, runStage, state)
      if (currentNode) window.setTimeout(runNextNode, 900)
    }

    runNextNode()
  }

  /** 現在のステージを開始直後の状態へ戻す。 */
  function reset() {
    setNodes(initialNodes()); setEdges([]); setInvalidIds([]); setRunState(freshRunState(stage))
  }

  /** 組み立てたフローチャートを残し、同じステージをもう一度実行できる状態にする。 */
  function playAgain() {
    setInvalidIds([])
    setRunState(freshRunState(stage))
  }

  /** ホーム画面へ戻る。 */
  function goHome() {
    setShowLegend(false)
    setScreen('home')
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
    setShowLegend(nextStage.id !== 'how-to-play')
  }

  if (screen === 'home') {
    return (
      <main className="app-shell home-screen">
        <header className="topbar"><div className="logo"><img src="./images/company-logo.png" alt="会社ロゴ" /></div><button className="guide-link" onClick={() => setScreen('guide')}>フローチャートとは？</button></header>
        <section className="home-hero">
        <h1>ねこ<ruby>社員<rt>しゃいん</rt></ruby>とフローチャート</h1>
        <p>ねこ<ruby>社員<rt>しゃいん</rt></ruby>と フローチャートを まなぼう！</p></section>
        <section className="cat-introductions" aria-labelledby="cat-introductions-title"><h2 id="cat-introductions-title">ねこ<ruby>社員<rt>しゃいん</rt></ruby>を <ruby>紹介<rt>しょうかい</rt></ruby>するよ</h2><div>{catEmployees.map((catEmployee) => <article key={catEmployee.id} className="cat-introduction-card"><img src={catEmployee.imagePath} alt={catEmployee.alt} /><div><h3>{catEmployee.name}{catEmployee.profile.honorific}</h3><p>{catEmployee.profile.role}ねこ<ruby>社員<rt>しゃいん</rt></ruby></p><p>{catEmployee.profile.specialty}</p></div></article>)}</div></section>
        <section className="stage-select"><h2>ステージを えらぼう</h2><div className="stage-cards">{stages.map((availableStage, index) => <button key={availableStage.id} className={`stage-card ${availableStage.id === 'how-to-play' ? 'tutorial-card' : ''}`} onClick={() => openStage(availableStage)}>{availableStage.id === 'how-to-play' ? <span className="tutorial-card-icon">📖</span> : <span className="stage-card-number">{index}</span>}<span className="stage-card-content"><span className="difficulty">{availableStage.difficulty}</span><strong>{availableStage.title}</strong><small>{availableStage.id === 'how-to-play' ? 'はじめての ひとへ' : 'タップして はじめる'}</small></span></button>)}</div></section>
      </main>
    )
  }

  if (screen === 'guide') {
    return <FlowchartGuide catImagePath={selectedCat.imagePath} catAlt={selectedCat.alt} onBack={() => setScreen('home')} />
  }

  return (
    <main className="app-shell">
      <header className="topbar"><div className="logo"><img src="./images/company-logo.png" alt="会社ロゴ" /></div><div className="stage-title"><span className="difficulty">{stage.difficulty}</span><h1>{stage.id === 'how-to-play' ? stage.title : `ステージ ${stages.findIndex((availableStage) => availableStage.id === stage.id)}　${stage.title}`}</h1></div><div className="header-actions"><button className="home-button" onClick={() => setScreen('home')}>ホームに戻る</button><button className="reset-button" onClick={reset}><ruby>最初<rt>さいしょ</rt></ruby>から</button></div></header>
      <section className="intro"><div className="cat-portrait"><img src={introCat.imagePath} alt={introCat.alt} /></div><p className="stage-description">{stage.description.map((part, index) => part.ruby ? <ruby key={index}>{part.text}<rt>{part.ruby}</rt></ruby> : <span className="stage-description" key={index}>{part.text}</span>)}</p></section><p className={stage.tutorial ? 'tutorial-guide' : 'stage-hint'}>{stage.tutorial ? tutorialMessage(tutorialStep) : `ヒント：${stage.hint}`}</p>
      <div className="game-layout">
        <aside className="palette panel"><h2><ruby>使<rt>つか</rt></ruby>う <ruby>記号<rt>きごう</rt></ruby></h2><p>ドラッグしてね</p>{stage.availableActions.map((action) => <button key={action} className={`palette-node ${action} ${tutorialStep?.type === 'place' && tutorialStep.action === action ? 'tutorial-target' : ''}`} onPointerDown={(event) => startNewAction(event, action)}>{labelFor(action)}<small>{action === 'decision' ? <><ruby>判断<rt>はんだん</rt></ruby></> : action === 'loopStart' || action === 'loopEnd' ? <><ruby>繰<rt>く</rt></ruby>り<ruby>返<rt>かえ</rt></ruby>し</> : <><ruby>処理<rt>しょり</rt></ruby></>}</small></button>)}</aside>
        <section className={`editor panel ${tutorialStep?.type === 'place' ? 'tutorial-drop-target' : ''}`}><div className="editor-heading"><h2>フローチャート</h2><div className="editor-actions">{edges.length > 0 && <p className="arrow-help">やじるしを タッチすると けせるよ</p>}<button className="legend-button" onClick={() => setShowLegend(true)}><ruby>記号<rt>きごう</rt></ruby>の <ruby>説明<rt>せつめい</rt></ruby></button><button className={`run-button ${tutorialStep?.type === 'run' ? 'tutorial-target' : ''}`} onClick={runFlow} disabled={runState.status === 'running'}>▶ うごかす</button></div></div><div ref={canvasRef} className="canvas">
          <svg className="edge-layer" aria-label="やじるしを さわると けせます">{edges.map((edge) => { const from = nodes.find((node) => node.id === edge.from); const to = nodes.find((node) => node.id === edge.to); if (!from || !to) return null; const connector = edge.branch === 'yes' ? DECISION_YES_CONNECTOR : DECISION_NO_CONNECTOR; const x1 = from.x + (from.action === 'decision' ? connector.x : NODE_WIDTH / 2); const y1 = from.y + (from.action === 'decision' ? connector.y : NODE_HEIGHT); const x2 = to.x + NODE_WIDTH / 2; const y2 = to.y; return <g key={edge.id}><line className="edge-hit-area" x1={x1} y1={y1} x2={x2} y2={y2} onPointerDown={(event) => { event.stopPropagation(); deleteEdge(edge.id) }} /><line className="edge-visible" x1={x1} y1={y1} x2={x2} y2={y2} markerEnd="url(#arrow)" /></g> })}{connecting && connectionPreview && (() => { const from = nodes.find((node) => node.id === connecting.id); const connector = connecting.branch === 'yes' ? DECISION_YES_CONNECTOR : DECISION_NO_CONNECTOR; const x1 = from ? from.x + (from.action === 'decision' ? connector.x : NODE_WIDTH / 2) : 0; const y1 = from ? from.y + (from.action === 'decision' ? connector.y : NODE_HEIGHT) : 0; return from && <line className="edge-preview" x1={x1} y1={y1} x2={connectionPreview.x} y2={connectionPreview.y} markerEnd="url(#arrow-preview)" /> })()}<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker><marker id="arrow-preview" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" /></marker></defs></svg>
          {nodes.map((node) => <div key={node.id} className={`flow-node ${node.action} ${invalidIds.includes(node.id) ? 'invalid' : ''} ${isTutorialConnectionTarget(tutorialStep, node.action) ? 'tutorial-target' : ''}`} style={{ left: node.x, top: node.y }} onPointerDown={(event) => { if ((event.target as HTMLElement).classList.contains('connector') || (event.target as HTMLElement).classList.contains('delete-node')) return; event.preventDefault(); setDragging({ id: node.id, offsetX: event.nativeEvent.offsetX, offsetY: event.nativeEvent.offsetY }) }}>{node.action !== 'start' && node.action !== 'end' && <button className="delete-node" aria-label={`${labelFor(node.action)}を けす`} onPointerDown={(event) => { event.stopPropagation(); deleteNode(node.id) }} />}{node.action !== 'start' && <span className="connector input" data-input-id={node.id} title="ここへつなぐ" />}<span className="node-label">{labelFor(node.action)}</span>{node.action === 'decision' ? <><span className="connector output decision-output yes" onPointerDown={(event) => { event.stopPropagation(); event.preventDefault(); setConnecting({ id: node.id, branch: 'yes' }); setConnectionPreview(canvasPoint(event)) }} title="はいをつなぐ" /><span className="connector output decision-output no" onPointerDown={(event) => { event.stopPropagation(); event.preventDefault(); setConnecting({ id: node.id, branch: 'no' }); setConnectionPreview(canvasPoint(event)) }} title="いいえをつなぐ" /></> : node.action !== 'end' && <span className="connector output" onPointerDown={(event) => { event.stopPropagation(); event.preventDefault(); setConnecting({ id: node.id }); setConnectionPreview(canvasPoint(event)) }} title="ここからつなぐ" />}</div>)}
          {connecting && <div className="connection-hint">つなぎたい きごうの ● まで ドラッグ！</div>}
          {nodes.every((node) => node.action === 'start' || node.action === 'end') && <div className="empty-canvas">左の きごうを、ここに ドラッグしてね。</div>}
        </div></section>
        <section className="board panel">
          <h2>ねこ<ruby>社員<rt>しゃいん</rt></ruby>のお<ruby>仕事<rt>しごと</rt></ruby></h2>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${stage.grid.columns}, 1fr)` }}>
            {Array.from({ length: stage.grid.columns }, (_, x) => {
              const y = stage.start.y
              const catHere = runState.cat.x === x && runState.cat.y === y
              const toyHere = stage.toy.x === x && stage.toy.y === y && !runState.hasToy
              const singleSnackHere = stage.snack?.x === x && stage.snack?.y === y && !runState.snackCollected
              const loopSnackHere = stage.snacks?.some((snack, index) => snack.x === x && snack.y === y && index >= runState.loopCount)
              const snackHere = singleSnackHere || loopSnackHere
              const boxHere = stage.box?.x === x && stage.box?.y === y
              const targetHere = stage.delivery.x === x && stage.delivery.y === y
              return <div key={x} className={`cell ${catHere && (toyHere || snackHere) ? 'cat-with-toy' : ''}`}>
                {targetHere && <span className="target">🧑‍💼</span>}
                {toyHere && <span className="toy">🧸</span>}
                {snackHere && <span className="toy">🐟</span>}
                {boxHere && <span className="box">{runState.boxOpened ? '' : '📦'}</span>}
                {boxHere && runState.boxOpened && <span className="box-content">{runState.boxContent === 'toy' ? '🧸' : '🐟'}</span>}
                {catHere && <img key={`cat-${errorShakeKey}`} className={`cat ${runState.status === 'success' ? 'happy' : runState.status === 'error' ? 'confused' : ''}`} src={selectedCat.imagePath} alt={selectedCat.alt} />}
              </div>
            })}
          </div>
          <div className={`speech ${runState.status}`}><img className="speech-cat" src={selectedCat.imagePath} alt="" /><p>{runState.message}</p></div>
        </section>
      </div>
      {newAction && newActionPreview && <div className={`flow-node drag-preview ${newAction}`} style={{ left: newActionPreview.x, top: newActionPreview.y }}>{labelFor(newAction)}</div>}
      {showLegend && <div className="legend-overlay" role="dialog" aria-modal="true" aria-labelledby="legend-title"><div className="legend-modal"><button className="legend-close" aria-label="説明をとじる" onClick={() => setShowLegend(false)} /><h2 id="legend-title"><ruby>記号<rt>きごう</rt></ruby>の <ruby>説明<rt>せつめい</rt></ruby></h2><p>フローチャートは、きごうと やじるしで <ruby>手順<rt>てじゅん</rt></ruby>を あらわすよ。</p><div className="legend-items"><div><span className="legend-symbol terminal">はじめ／おわり</span><p><ruby>端子<rt>たんし</rt></ruby>：ながれの はじまりと おわり。</p></div>{stage.availableActions.some((action) => !['decision', 'loopStart', 'loopEnd'].includes(action)) && <div><span className="legend-symbol process"><ruby>処理<rt>しょり</rt></ruby></span><p><ruby>処理<rt>しょり</rt></ruby>：ねこ<ruby>社員<rt>しゃいん</rt></ruby>に してほしいこと。</p></div>}{stage.availableActions.includes('decision') && <div><span className="legend-symbol decision">◇</span><p><ruby>判断<rt>はんだん</rt></ruby>：「はい」と「いいえ」の みちを えらぶよ。</p></div>}{stage.availableActions.includes('loopStart') && <div><span className="legend-loop-symbols"><span className="legend-loop-symbol loop-start">はじめ</span><span className="legend-loop-symbol loop-end">おわり</span></span><p><ruby>反復端子<rt>はんぷくたんし</rt></ruby>：「3回 くりかえす」がループの <ruby>開始<rt>かいし</rt></ruby>、「ここまで くりかえす」がループの <ruby>終了<rt>しゅうりょう</rt></ruby>。2つを セットで つかうよ。</p></div>}<div><span className="legend-arrow">→</span><p>やじるし：つぎに すすむ みち。</p></div></div><button className="legend-ok" onClick={() => setShowLegend(false)}>わかった！</button></div></div>}
      {runState.status === 'success' && <div className="success-overlay"><div><span>🎉</span><h2>クリア！ おめでとう！</h2><div className="success-actions"><button className="success-home" onClick={goHome}>ホーム<ruby>画面<rt>がめん</rt></ruby>へ</button><button className="success-again" onClick={playAgain}>もういちど あそぶ</button></div></div></div>}
    </main>
  )
}
