import type { Action, FlowEdge, FlowNode, StageDefinition, TutorialStep } from './types'

/** 未完了の最初のチュートリアル手順を取得する。 */
export function getCurrentTutorialStep(
  stage: StageDefinition,
  nodes: FlowNode[],
  edges: FlowEdge[],
): TutorialStep | undefined {
  if (!stage.tutorial) return undefined

  return stage.tutorial.steps.find((step) => {
    if (step.type === 'place') {
      return !nodes.some((node) => node.action === step.action)
    }

    if (step.type === 'connect') {
      return !edges.some((edge) => {
        const from = nodes.find((node) => node.id === edge.from)
        const to = nodes.find((node) => node.id === edge.to)
        return from?.action === step.from && to?.action === step.to && edge.branch === step.branch
      })
    }

    return true
  })
}

/** 案内中の記号を編集領域へ置けるかを判定する。 */
export function canPlaceTutorialAction(step: TutorialStep | undefined, action: Action) {
  return !step || (step.type === 'place' && step.action === action)
}

/** 案内中の2つの記号を矢印でつなげられるかを判定する。 */
export function canConnectTutorialNodes(
  step: TutorialStep | undefined,
  from: FlowNode | undefined,
  to: FlowNode | undefined,
  branch?: 'yes' | 'no',
) {
  return !step || (step.type === 'connect' && from?.action === step.from && to?.action === step.to && branch === step.branch)
}

/** 指定した記号を、現在のチュートリアルで強調するかを判定する。 */
export function isTutorialConnectionTarget(step: TutorialStep | undefined, action: Action) {
  return step?.type === 'connect' && (step.from === action || step.to === action)
}

/** チュートリアル用の案内文を返す。 */
export function tutorialMessage(step: TutorialStep | undefined) {
  return step?.message ?? 'できたね！「うごかす」を おしてみよう。'
}
