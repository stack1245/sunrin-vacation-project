export { MathdokuPuzzleScene } from "./mathdokuPuzzleScene";
export { NQueensPuzzleScene } from "./nQueensPuzzleScene";
export {
  ResourceAllocationPuzzleScene,
  ResourceAllocationPuzzleScene as ResourcePuzzleScene,
} from "./resourceAllocationPuzzleScene";
export {
  TtfPuzzleScene,
  TtfPuzzleScene as TTFPuzzleScene,
} from "./ttfPuzzleScene";
export { AgoPuzzleScene } from "./agoPuzzleScene";
export {
  DOCUMENT_STORAGE_PHASER_PUZZLE_COMPLETED_EVENT,
  DOCUMENT_STORAGE_PUZZLE_CLEARED_EVENT,
  OPEN_DOCUMENT_STORAGE_PUZZLE_EVENT,
  markDocumentStoragePuzzleCleared,
  openDocumentStoragePuzzle,
  subscribeToDocumentStoragePuzzleCleared,
  subscribeToDocumentStoragePuzzleOpen,
  type DocumentStoragePuzzleClearedDetail,
  type DocumentStoragePuzzleType,
  type OpenDocumentStoragePuzzleDetail,
  type OpenPuzzleEventDetail,
} from "./documentStoragePuzzleEvents";
