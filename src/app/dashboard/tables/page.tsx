"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Database, Plus, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "../../../../supabase/client";
import { tableService } from "@/lib/table-service";

export default function TablesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tableStats, setTableStats] = useState({});

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
    setError("");
    try {
      // Get all table definitions
      const tableDefinitions = await tableService.getTables();
      setTables(tableDefinitions);

      // Get row counts for each table
      const stats = {};
      for (const table of tableDefinitions) {
        try {
          const entities = await tableService.getEntities(table.id);
          stats[table.id] = {
            rows: entities.length,
            columns: table.schema.length,
          };
        } catch (err) {
          console.error(`Error fetching stats for table ${table.id}:`, err);
          stats[table.id] = { rows: 0, columns: table.schema.length };
        }
      }
      setTableStats(stats);
    } catch (err) {
      console.error("Error fetching tables:", err);
      setError("Failed to load tables: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (id: string) => {
    try {
      await tableService.deleteTable(id);
      fetchTables(); // Refresh the list
    } catch (err) {
      console.error("Error deleting table:", err);
      setError("Failed to delete table: " + err.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-[#080808] min-h-screen text-white">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Tables</h1>
            <p className="text-[#ababab]">Manage your custom database tables</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/table-designer")}
            className="bg-[#ff004f] hover:bg-[#e0003f] text-white flex items-center gap-2"
          >
            <Plus size={16} />
            Create New Table
          </Button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-400">{error}</p>
            <Button
              onClick={fetchTables}
              className="ml-auto bg-[#ff004f] hover:bg-[#e0003f] text-white"
            >
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-[#ababab]">Loading tables...</div>
          </div>
        ) : tables.length === 0 ? (
          <div className="bg-[#262626] rounded-xl p-12 border border-[#333] text-center">
            <Database size={48} className="mx-auto mb-4 text-[#ababab]" />
            <h2 className="text-xl font-medium mb-2">No Tables Yet</h2>
            <p className="text-[#ababab] mb-6">
              Create your first table to start managing your data
            </p>
            <Button
              onClick={() => router.push("/dashboard/table-designer")}
              className="bg-[#ff004f] hover:bg-[#e0003f] text-white"
            >
              Create Your First Table
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div
                key={table.id}
                className="bg-[#262626] rounded-xl p-6 border border-[#333] hover:border-[#ff004f] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-[#1a1a1a] p-3 rounded-lg">
                    <Database className="h-6 w-6 text-[#ff004f]" />
                  </div>
                  <Button
                    onClick={() => deleteTable(table.id)}
                    variant="ghost"
                    size="sm"
                    className="text-[#ababab] hover:text-[#ff004f] hover:bg-transparent"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <h3 className="text-xl font-medium mb-1">{table.name}</h3>
                {table.description && (
                  <p className="text-[#ababab] text-sm mb-2 line-clamp-2">
                    {table.description}
                  </p>
                )}
                <p className="text-[#ababab] text-sm mb-4">
                  Created on {formatDate(table.created_at)}
                </p>

                <div className="flex justify-between text-sm text-[#ababab] mb-6">
                  <span>
                    {tableStats[table.id]?.columns || table.schema.length}{" "}
                    columns
                  </span>
                  <span>{tableStats[table.id]?.rows || 0} rows</span>
                </div>

                <Link
                  href={`/dashboard/table-designer/${table.id}`}
                  className="block w-full py-2 text-center bg-[#1a1a1a] hover:bg-[#ff004f] text-white rounded-lg transition-colors"
                >
                  View & Edit Data
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
