import { Header, Footer } from "@/components/layout";
import { DashboardContent } from "./DashboardContent";

export const metadata = {
  title: "Dashboard",
  description: "Manage your bounties and submissions",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container-custom">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="heading-1 text-text-primary">Dashboard</h1>
            <p className="mt-2 text-text-secondary">
              Manage your bounties, claims, and submissions
            </p>
          </div>

          {/* Dashboard Content - Client Component */}
          <DashboardContent />
        </div>
      </main>

      <Footer />
    </div>
  );
}


