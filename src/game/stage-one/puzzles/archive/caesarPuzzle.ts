export interface CaesarPuzzleData {
  cipherText: string;
  shift: number;
  answer: string;
}

export const CAESAR_PUZZLE: CaesarPuzzleData = {
  cipherText: "DFFHVV JUDQWHG",
  shift: 3,
  answer: "ACCESS GRANTED",
};

export function normalizeAnswer(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, "");
}

export function checkCaesarAnswer(raw: string): boolean {
  return normalizeAnswer(raw) === normalizeAnswer(CAESAR_PUZZLE.answer);
}