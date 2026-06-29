import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <main className="flex flex-col items-center min-h-screen py-16 px-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-ink">Admin 🛠️</h1>
          <p className="text-muted font-medium">
            Manage sessions, configure questions, and pick the presenter.
          </p>
        </div>
        <AdminPanel />
      </div>
    </main>
  );
}
