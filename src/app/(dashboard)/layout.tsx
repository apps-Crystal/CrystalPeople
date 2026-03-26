// Protected dashboard layout — middleware handles auth.
// The AppShell (in root layout) provides sidebar + header.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
