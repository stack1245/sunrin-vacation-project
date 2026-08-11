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

export const SCIENCE_LAB_SEQUENCE_CLUE = [
  "화학 기호",
  "용액 밀도",
  "산소 공급",
  "점화",
  "가열",
] as const;

export const DOCUMENT_STORAGE_SYMBOL_ORDER_CLUE = "%$#@!" as const;

export function checkVigenereAnswer(raw: string): boolean {
  return normalizeAnswer(raw) === normalizeAnswer(VIGENERE_PUZZLE.answer);
}

export function describeArchiveClues(): string {
  const scienceLabSequence = SCIENCE_LAB_SEQUENCE_CLUE.join(" → ");
  const documentStorageSequence = DOCUMENT_STORAGE_SYMBOL_ORDER_CLUE
    .split("")
    .join(" → ");

  return [
    `과학 실험실 순서: ${scienceLabSequence}`,
    `문서 보관실 순서: ${documentStorageSequence}`,
  ].join("\n");
}
