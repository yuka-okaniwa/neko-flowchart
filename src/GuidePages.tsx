import { Children, useState, type ReactNode } from 'react'

/** 横画面では説明を一枚ずつ表示し、本文を縮小せずに読めるようにする。 */
export function GuidePages({ children }: { children: ReactNode }) {
  const pages = Children.toArray(children)
  const [page, setPage] = useState(0)
  return <>
    {pages.map((content, index) => <div key={index} className={`guide-page ${index === page ? 'is-active' : ''}`}>{content}</div>)}
    <nav className="guide-pagination" aria-label="説明のページ送り">
      <button className="home-button" disabled={page === 0} onClick={() => setPage(page - 1)}>← まえへ</button>
      <span aria-live="polite">{page + 1} / {pages.length}</span>
      <button className="home-button" disabled={page === pages.length - 1} onClick={() => setPage(page + 1)}>つぎへ →</button>
    </nav>
  </>
}
