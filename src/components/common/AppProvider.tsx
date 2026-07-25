"use client";

import type { ReactNode } from "react";

interface AppProviderProps {
  children: ReactNode;
}

/**
 * 전역 클라이언트 Provider 진입점입니다.
 * Zustand는 별도 Context 없이 동작하므로 현재는 자식만 렌더링합니다.
 */
export function AppProvider({ children }: AppProviderProps) {
  return children;
}
