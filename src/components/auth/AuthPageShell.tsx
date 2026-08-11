import type { ReactNode } from "react";

import { AuthDialog } from "@/components/auth/AuthDialog";
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
    <div className="relative min-h-dvh overflow-x-hidden bg-[url('/background.svg')] bg-cover bg-center bg-no-repeat text-stone-100">
      <SiteHeader />

      <AuthDialog
        eyebrow={eyebrow}
        title={title}
        description={description}
      >
        {children}
      </AuthDialog>
    </div>
  );
}
