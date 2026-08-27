import type { CatEmployee } from './types'

/**
 * 猫社員の一覧。
 * 将来はこの配列へ猫を追加し、選択UIからidを指定して画像を切り替える。
 */
export const catEmployees: CatEmployee[] = [
  {
    id: 'mii',
    name: 'みぃ',
    imagePath: '/images/nekosyain/mii.png',
    alt: 'ねこ社員 みぃ',
    profile: {
      role: 'ベテラン',
      specialty: 'まるくなるのが とくい',
      honorific: 'さん',
    },
  },
  {
    id: 'furom',
    name: 'ふろむ',
    imagePath: '/images/nekosyain/furom1.png',
    alt: 'ねこ社員 ふろむ',
    profile: {
      role: '新人',
      specialty: 'たべるのが すき',
    },
  },
]
