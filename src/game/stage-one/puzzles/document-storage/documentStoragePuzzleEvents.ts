import type { StageOneModalInputRelease } from "../../contracts/room";

export const OPEN_DOCUMENT_STORAGE_PUZZLE_EVENT =
  "open-document-puzzle" as const;
export const DOCUMENT_STORAGE_PUZZLE_CLEARED_EVENT =
  "puzzle-cleared-event" as const;
export const DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT =
  "document-storage-puzzle-completed" as const;

export type DocumentStoragePuzzleType =
  | "ago"
  | "mathdoku"
  | "nqueens"
  | "resource"
  | "ttf";

export interface OpenDocumentStoragePuzzleDetail {
  puzzleType: DocumentStoragePuzzleType;
  title: string;
  releaseInputLock: StageOneModalInputRelease;
}

export interface DocumentStoragePuzzleClearedDetail {
  puzzleType: DocumentStoragePuzzleType;
}

/** 기존 공개 타입 이름을 유지하면서 역할이 분명한 이름으로 전환한다. */
export type OpenPuzzleEventDetail = OpenDocumentStoragePuzzleDetail;

export function openDocumentStoragePuzzle(
  detail: OpenDocumentStoragePuzzleDetail,
): void {
  window.dispatchEvent(
    new CustomEvent<OpenDocumentStoragePuzzleDetail>(
      OPEN_DOCUMENT_STORAGE_PUZZLE_EVENT,
      { detail },
    ),
  );
}

export function subscribeToDocumentStoragePuzzleOpen(
  listener: (detail: OpenDocumentStoragePuzzleDetail) => void,
): () => void {
  const handleOpen = (event: Event) => {
    const detail = (event as CustomEvent<OpenDocumentStoragePuzzleDetail>)
      .detail;

    if (detail) {
      listener(detail);
    }
  };

  window.addEventListener(OPEN_DOCUMENT_STORAGE_PUZZLE_EVENT, handleOpen);

  return () => {
    window.removeEventListener(OPEN_DOCUMENT_STORAGE_PUZZLE_EVENT, handleOpen);
  };
}

export function markDocumentStoragePuzzleCleared(
  detail: DocumentStoragePuzzleClearedDetail,
): void {
  window.dispatchEvent(
    new CustomEvent<DocumentStoragePuzzleClearedDetail>(
      DOCUMENT_STORAGE_PUZZLE_CLEARED_EVENT,
      { detail },
    ),
  );
}

export function subscribeToDocumentStoragePuzzleCleared(
  listener: (detail: DocumentStoragePuzzleClearedDetail) => void,
): () => void {
  const handleCleared = (event: Event) => {
    const detail = (event as CustomEvent<DocumentStoragePuzzleClearedDetail>)
      .detail;

    if (detail) {
      listener(detail);
    }
  };

  window.addEventListener(DOCUMENT_STORAGE_PUZZLE_CLEARED_EVENT, handleCleared);

  return () => {
    window.removeEventListener(
      DOCUMENT_STORAGE_PUZZLE_CLEARED_EVENT,
      handleCleared,
    );
  };
}
