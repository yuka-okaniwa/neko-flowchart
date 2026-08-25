import type { CatEmployee } from './types'

/**
 * 猫社員の一覧。
 * 将来はこの配列へ猫を追加し、選択UIからidを指定して画像を切り替える。
 */
export const catEmployees: CatEmployee[] = [
  {
    id: 'furom',
    name: 'ふろむ',
    imagePath: '/images/nekosyain/furom1.png',
    alt: 'ねこ社員 ふろむ',
  },
]
