import { AppShell } from "@/components/layout/app-shell";
import { FarmStoreProvider } from "@/contexts/farm-store";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FarmStoreProvider>
      <AppShell>{children}</AppShell>
    </FarmStoreProvider>
  );
}
