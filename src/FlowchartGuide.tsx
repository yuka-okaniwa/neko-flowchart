type FlowchartGuideProps = {
  catImagePath: string
  catAlt: string
  onBack: () => void
}

/** フローチャートの基本を、身近な例と一緒に説明するページ。 */
export function FlowchartGuide({ catImagePath, catAlt, onBack }: FlowchartGuideProps) {
  return (
    <main className="app-shell guide-screen">
      <header className="topbar">
        <div className="logo"><img src="/images/company-logo.png" alt="会社ロゴ" /></div>
        <button className="home-button" onClick={onBack}>ホームに戻る</button>
      </header>

      <article className="guide-content">
        <div className="guide-hero">
          <img src={catImagePath} alt={catAlt} />
          <div>
            <p className="guide-kicker">ねこ社員と 学ぼう！</p>
            <h1>フローチャートとは？</h1>
            <p><ruby>物事<rt>ものごと</rt></ruby>を する<ruby>順番<rt>じゅんばん</rt></ruby>を、<br />記号と やじるしで <ruby>見<rt>み</rt></ruby>えるように したものだよ。</p>
          </div>
        </div>

        <section className="guide-section">
          <h2>どんな ときに つかうの？</h2>
          <p>「まず 何をして、つぎに 何をする？」を、みんなで わかりやすく したいときに つかうよ。プログラムを 作るときだけでなく、りょうりや 学校の じゅんびにも つかえるんだ。</p>
          <div className="guide-example"><span>🥞</span><p>たとえば、パンケーキを 作るなら<br /><strong>はじめる → まぜる → やく → できあがり</strong></p></div>
        </section>

        <section className="guide-section">
          <h2>よく つかう 3つの 記号</h2>
          <div className="guide-symbols">
            <div className="guide-symbol-card"><span className="guide-symbol terminal">はじめ／おわり</span><div><h3>はじめ・おわり</h3><p>手順の スタートと ゴールを あらわすよ。</p></div></div>
            <div className="guide-symbol-card"><span className="guide-symbol process">すること</span><div><h3><ruby>処理<rt>しょり</rt></ruby></h3><p>「1マス すすむ」のように、することを 書くよ。</p></div></div>
            <div className="guide-symbol-card"><span className="guide-symbol decision">？</span><div><h3><ruby>判断<rt>はんだん</rt></ruby></h3><p>「はい」と「いいえ」で、つぎの道を えらぶよ。</p></div></div>
          </div>
        </section>

        <section className="guide-section">
          <h2>やじるしを たどってみよう</h2>
          <p>やじるしは、「つぎは ここへ すすむ」という しるし。<strong>はじめから おわりまで、やじるしを たどれる</strong>ように つなぐのが コツだよ。</p>
          <div className="guide-flow" aria-label="雨がふっているかを判断するフローチャートの例">
            <span className="guide-flow-node terminal">はじめ</span><span className="guide-arrow">↓</span><span className="guide-flow-node decision">雨が ふっている？</span><div className="guide-branches"><div><span className="branch-label yes">はい</span><span className="guide-arrow">↓</span><span className="guide-flow-node process">かさを もつ</span></div><div><span className="branch-label no">いいえ</span><span className="guide-arrow">↓</span><span className="guide-flow-node process">そのまま いく</span></div></div><span className="guide-arrow">↓</span><span className="guide-flow-node terminal">おわり</span>
          </div>
        </section>

        <section className="guide-tip"><h2>ねこ社員との おやくそく</h2><p>ねこ社員が まよわないように、やじるしを とぎれさせずに つないでね。できたら「うごかす」で、手順が あっているか たしかめよう！</p></section>
      </article>
    </main>
  )
}
