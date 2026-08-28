import type { StageDefinition } from './types'

type LoopGuideProps = {
  stage: StageDefinition
  catImagePath: string
  catAlt: string
  onContinue: () => void
  onHome: () => void
}

/** ループを使うステージの前に表示する、反復端子の詳しい説明ページ。 */
export function LoopGuide({ stage, catImagePath, catAlt, onContinue, onHome }: LoopGuideProps) {
  const repeatCount = stage.loop?.repeatUntil ?? 3

  return (
    <main className="app-shell loop-guide-screen">
      <header className="topbar"><div className="logo"><img src="/images/company-logo.png" alt="会社ロゴ" /></div><button className="home-button" onClick={onHome}>ホームに戻る</button></header>
      <article className="loop-guide-content">
        <div className="loop-guide-heading"><img src={catImagePath} alt={catAlt} /><div><p>ステージ3の まえに</p><h1>くりかえし<ruby>記号<rt>きごう</rt></ruby>を <ruby>知<rt>し</rt></ruby>ろう！</h1></div></div>
        <section className="loop-guide-card"><h2>くりかえし<ruby>記号<rt>きごう</rt></ruby>は 2つで 1セット</h2><p>同じことを 何回も したいときに つかうよ。今回は「{repeatCount}回」くりかえすよ。</p><div className="loop-guide-symbols"><div><span className="loop-guide-symbol loop-start">{repeatCount}回<br />くりかえす</span><h3>ループの <ruby>開始<rt>かいし</rt></ruby></h3><p>ここから、くりかえしが はじまるよ。</p></div><span className="loop-guide-arrow">↓</span><div><span className="loop-guide-process">することを ここに おく</span><p>「1マス すすむ」「おやつを たべる」を はさもう。</p></div><span className="loop-guide-arrow">↓</span><div><span className="loop-guide-symbol loop-end">ここまで<br />くりかえす</span><h3>ループの <ruby>終了<rt>しゅうりょう</rt></ruby></h3><p>ここまでを {repeatCount}回 したら、つぎへ すすむよ。</p></div></div></section>
        <section className="loop-guide-tip"><h2>おぼえておこう</h2><p>ループの <ruby>開始<rt>かいし</rt></ruby>と <ruby>終了<rt>しゅうりょう</rt></ruby>の あいだに、くりかえしたい <ruby>処理<rt>しょり</rt></ruby>を ならべよう。</p></section>
        <button className="loop-guide-continue" onClick={onContinue}>記号<ruby>説明<rt>せつめい</rt></ruby>へ すすむ</button>
      </article>
    </main>
  )
}
