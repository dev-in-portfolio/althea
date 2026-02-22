export type Glyph = {
  id: string
  code: string
  name: string
  category: string
  meaning?: string
  notes?: string
}

export const glyphs: Glyph[] = [
  {
    id: "A1",
    code: "𓀀",
    name: "Seated Man",
    category: "Man and His Occupations",
    meaning: "man, person"
  },
  {
    id: "D36",
    code: "𓂧",
    name: "Hand",
    category: "Parts of the Body",
    meaning: "hand, action"
  }
]
