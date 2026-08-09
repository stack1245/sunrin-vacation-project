import { normalizeAnswer } from "./caesarPuzzle.ts";

export interface VigenerePuzzleData {
  cipherText: string;
  keyword: string;
  answer: string;
}

export const VIGENERE_PUZZLE: VigenerePuzzleData = {
  cipherText: "DMOLZZ QBOST PTJG",
  keyword: "LOCK",
  answer: "SYMBOL ORDER FIVE",
};

export function checkVigenereAnswer(raw: string): boolean {
  return normalizeAnswer(raw) === normalizeAnswer(VIGENERE_PUZZLE.answer);
}