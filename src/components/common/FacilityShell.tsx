import type { ReactNode } from "react";

interface FacilityShellProps {
  children: ReactNode;
  className?: string;
}

/** 웹 화면 전체에 연구 시설 배경과 공통 시각 계층을 제공한다. */
export function FacilityShell({
  children,
  className = "",
}: FacilityShellProps) {
  return <div className={`facility-shell ${className}`}>{children}</div>;
}
