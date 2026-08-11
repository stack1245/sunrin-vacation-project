import type { ReactNode } from "react";

import { AuthDialog } from "@/components/auth/AuthDialog";
import { FacilityShell } from "@/components/common/FacilityShell";
import { SiteHeader } from "@/components/common/SiteHeader";

interface AuthPageShellProps {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}

export function AuthPageShell({
  children,
  description,
  eyebrow,
  title,
}: AuthPageShellProps) {
  return (
    <FacilityShell>
      <SiteHeader />

      <AuthDialog
        eyebrow={eyebrow}
        title={title}
        description={description}
      >
        {children}
      </AuthDialog>
    </FacilityShell>
  );
}
