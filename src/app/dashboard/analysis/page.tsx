"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "../../../../supabase/client";
import { useState, useEffect } from "react";
import { tableService } from "@/lib/table-service";
import { useRouter } from "next/navigation";
import { BarChart3, LineChart, PieChart } from "lucide-react";

export default function AnalysisPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchTables();
      } else {
        window.location.href = "/sign-in";
      }
    };
    getUser();
  }, [supabase.auth]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const tableDefinitions = await tableService.getTables();
      setTables(tableDefinitions);
      if (tableDefinitions.length > 0) {
        setSelectedTable(tableDefinitions[0].id);
      }
    } catch (err) {
      console.error("Error fetching tables:", err);
      // Handle error gracefully without accessing properties directly
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeTable = () => {
    if (selectedTable) {
      router.push(`/dashboard/analysis/${selectedTable}`);
    }
  };

  if (!user) {
    return (
      <div className="bg-[#080808] min-h-screen text-white">Loading...</div>
    );
  }

  return (
    <div className="bg-[#080808] min-h-screen text-white">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analysis Dashboard</h1>
          <p className="text-[#ababab]">
            Visualize and analyze your data with powerful charts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#262626] p-6 rounded-xl border border-[#333] flex flex-col items-center hover:border-[#ff004f] transition-colors cursor-pointer">
            <BarChart3 size={48} className="text-[#ff004f] mb-4" />
            <h3 className="text-xl font-medium mb-2">Column Chart</h3>
            <p className="text-[#ababab] text-center text-sm">
              Compare values across categories
            </p>
          </div>

          <div className="bg-[#262626] p-6 rounded-xl border border-[#333] flex flex-col items-center hover:border-[#ff004f] transition-colors cursor-pointer">
            <LineChart size={48} className="text-[#ff004f] mb-4" />
            <h3 className="text-xl font-medium mb-2">Line Chart</h3>
            <p className="text-[#ababab] text-center text-sm">
              Track changes over time or sequence
            </p>
          </div>

          <div className="bg-[#262626] p-6 rounded-xl border border-[#333] flex flex-col items-center hover:border-[#ff004f] transition-colors cursor-pointer">
            <PieChart size={48} className="text-[#ff004f] mb-4" />
            <h3 className="text-xl font-medium mb-2">Pie Chart</h3>
            <p className="text-[#ababab] text-center text-sm">
              Show proportion and distribution
            </p>
          </div>
        </div>

        <div className="bg-[#262626] rounded-xl p-6 border border-[#333]">
          <h2 className="text-xl font-medium mb-4">
            Select a Table to Analyze
          </h2>

          {loading ? (
            <p className="text-[#ababab]">Loading tables...</p>
          ) : tables.length === 0 ? (
            <div className="text-center">
              <p className="text-[#ababab] mb-4">
                No tables found. Create a table first to analyze data.
              </p>
              <Button
                onClick={() => router.push("/dashboard/table-designer")}
                className="bg-[#ff004f] hover:bg-[#e0003f] text-white"
              >
                Create Your First Table
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <label
                  htmlFor="tableSelect"
                  className="block text-[#ababab] mb-2"
                >
                  Choose a table:
                </label>
                <select
                  id="tableSelect"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-md p-2 text-white"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                >
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleAnalyzeTable}
                className="bg-[#ff004f] hover:bg-[#e0003f] text-white w-full"
                disabled={!selectedTable}
              >
                View and Analyze Table Data
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 bg-[#262626] rounded-xl p-6 border border-[#333]">
          <h2 className="text-xl font-medium mb-4">Statistical Summary</h2>
          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 border border-[#333] rounded-lg text-center">
                <p className="text-[#ababab] text-sm mb-1">Mean</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="p-4 border border-[#333] rounded-lg text-center">
                <p className="text-[#ababab] text-sm mb-1">Median</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="p-4 border border-[#333] rounded-lg text-center">
                <p className="text-[#ababab] text-sm mb-1">Mode</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="p-4 border border-[#333] rounded-lg text-center">
                <p className="text-[#ababab] text-sm mb-1">Min</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="p-4 border border-[#333] rounded-lg text-center">
                <p className="text-[#ababab] text-sm mb-1">Max</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
