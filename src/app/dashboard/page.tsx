import DashboardNavbar from "@/components/dashboard-navbar";
import { InfoIcon, UserCircle, Database, BarChart3, Mic } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="bg-[#080808] min-h-screen">
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <div className="header-text">
              <p>Welcome to your</p>
              <h1>
                Data<span className="text-[#ff004f]">Dashboard</span>
              </h1>
            </div>
            <div className="bg-[#262626] text-sm p-3 px-4 rounded-lg text-[#ababab] flex gap-2 items-center">
              <InfoIcon size="14" className="text-[#ff004f]" />
              <span>
                This is your personal dashboard for managing database tables and
                analytics
              </span>
            </div>
          </header>

          {/* Services Section */}
          <section className="mt-8">
            <h2 className="text-3xl font-semibold mb-6 text-white">Services</h2>
            <div className="services-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[#262626] p-8 rounded-lg transition-all duration-500 hover:bg-[#ff004f] hover:translate-y-[-10px]">
                <Database size={50} className="mb-6" />
                <h2 className="text-xl font-medium mb-3">Table Designer</h2>
                <p className="text-[#ababab] mb-4 text-sm">
                  Create and manage custom database tables with multiple data
                  types
                </p>
                <Link
                  href="/dashboard/tables"
                  className="text-sm inline-block mt-4"
                >
                  Manage Tables
                </Link>
              </div>

              <div className="bg-[#262626] p-8 rounded-lg transition-all duration-500 hover:bg-[#ff004f] hover:translate-y-[-10px]">
                <BarChart3 size={50} className="mb-6" />
                <h2 className="text-xl font-medium mb-3">Data Analysis</h2>
                <p className="text-[#ababab] mb-4 text-sm">
                  Visualize your data with dynamic charts and statistical
                  summaries
                </p>
                <Link
                  href="/dashboard/analysis"
                  className="text-sm inline-block mt-4"
                >
                  Analyze Data
                </Link>
              </div>

              <div className="bg-[#262626] p-8 rounded-lg transition-all duration-500 hover:bg-[#ff004f] hover:translate-y-[-10px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="50"
                  height="50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-6"
                >
                  <path d="M3 3v5h5" />
                  <path d="M3 3l6.5 6.5" />
                  <path d="M21 21v-5h-5" />
                  <path d="M21 21l-6.5-6.5" />
                  <path d="M9 3h1" />
                  <path d="M9 21h1" />
                  <path d="M14 3h1" />
                  <path d="M14 21h1" />
                  <path d="M3 9v1" />
                  <path d="M21 9v1" />
                  <path d="M3 14v1" />
                  <path d="M21 14v1" />
                </svg>
                <h2 className="text-xl font-medium mb-3">Command History</h2>
                <p className="text-[#ababab] mb-4 text-sm">
                  View and manage your past database operations and command
                  history
                </p>
                <Link
                  href="/dashboard/history"
                  className="text-sm inline-block mt-4"
                >
                  View History
                </Link>
              </div>
            </div>
          </section>

          {/* User Profile Section */}
          <section className="bg-[#262626] rounded-xl p-6 border border-[#333] mt-8">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-[#ff004f]" />
              <div>
                <h2 className="font-semibold text-xl">User Profile</h2>
                <p className="text-sm text-[#ababab]">{user.email}</p>
              </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#ababab]">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-[#ababab]">Account Type</p>
                  <p className="font-medium">Standard</p>
                </div>
                <div>
                  <p className="text-sm text-[#ababab]">Member Since</p>
                  <p className="font-medium">
                    {new Date(
                      user.created_at || Date.now(),
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#ababab]">Status</p>
                  <p className="font-medium text-green-500">Active</p>
                </div>
              </div>
            </div>
            <Link href="#" className="btn mt-6 mx-0 inline-flex">
              Edit Profile
            </Link>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#262626] text-center py-6 mt-12">
        <p className="text-sm text-[#ababab]">
          © 2024 <span className="text-[#ff004f]">VoiceSQL</span>. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
