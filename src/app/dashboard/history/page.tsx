"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "../../../../supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Database,
  Trash2,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { tableService } from "@/lib/table-service";

export default function HistoryPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, insert, update, delete

  // Define history item interface
  interface HistoryItem {
    id: string;
    action: string;
    table: string;
    timestamp: string;
    details: string;
    command: string;
  }

  // Mock history data - in a real app, this would come from the database
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: "1",
      action: "insert",
      table: "employees",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      details: "Added new employee: John Smith",
      command:
        "Add a new employee with name John Smith, salary 85000, and email john.smith@example.com",
    },
    {
      id: "2",
      action: "update",
      table: "employees",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      details: "Updated employee: Sarah Williams",
      command: "Update Sarah Williams' salary to 92000",
    },
    {
      id: "3",
      action: "delete",
      table: "customers",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      details: "Deleted customer: Michael Brown",
      command: "Delete the record for Michael Brown",
    },
    {
      id: "4",
      action: "insert",
      table: "products",
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      details: "Added new product: Wireless Headphones",
      command:
        "Add a new product with name Wireless Headphones, price 129.99, and category Electronics",
    },
    {
      id: "5",
      action: "update",
      table: "inventory",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      details: "Updated inventory: Laptop Stock",
      command: "Update Laptop stock to 45 units",
    },
  ]);

  const [tableStats, setTableStats] = useState<Record<string, any>>({});

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchHistory();
      } else {
        window.location.href = "/sign-in";
      }
    };
    getUser();
  }, [supabase.auth]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Get table definitions to map IDs to names
      const tableDefinitions = await tableService.getTables();
      const tableMap: Record<string, string> = {};
      if (tableDefinitions && Array.isArray(tableDefinitions)) {
        tableDefinitions.forEach((table) => {
          if (table && table.id && table.name) {
            tableMap[table.id] = table.name;
          }
        });
      }

      // Get all entities with their history
      const { data: dynamicEntities, error } = await supabase
        .from("dynamic_entities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Format the history data
      const historyItems: HistoryItem[] = [];

      if (dynamicEntities && dynamicEntities.length > 0) {
        dynamicEntities.forEach((entity, index) => {
          const tableName = tableMap[entity.table_id] || "Unknown Table";
          const entityData = entity.data || {};
          const name =
            entityData.name || entityData.id || `Record ${index + 1}`;

          historyItems.push({
            id: entity.id,
            action: "insert",
            table: tableName,
            timestamp: entity.created_at,
            details: `Added new ${tableName.slice(0, -1) || "record"}: ${name}`,
            command: `Add a new ${tableName.slice(0, -1) || "record"} with ${Object.entries(
              entityData,
            )
              .map(([key, value]) => `${key} ${value}`)
              .join(", ")}`,
          });

          // If updated_at is different from created_at, add an update entry
          if (entity.updated_at && entity.updated_at !== entity.created_at) {
            historyItems.push({
              id: `${entity.id}-update`,
              action: "update",
              table: tableName,
              timestamp: entity.updated_at,
              details: `Updated ${tableName.slice(0, -1) || "record"}: ${name}`,
              command: `Update ${name}'s data`,
            });
          }
        });
      }

      setHistory(historyItems);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "insert":
        return "text-green-500";
      case "update":
        return "text-blue-500";
      case "delete":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "insert":
        return <span className="bg-green-500/20 p-1 rounded-full">+</span>;
      case "update":
        return <span className="bg-blue-500/20 p-1 rounded-full">↻</span>;
      case "delete":
        return <span className="bg-red-500/20 p-1 rounded-full">-</span>;
      default:
        return <span className="bg-gray-500/20 p-1 rounded-full">?</span>;
    }
  };

  const filteredHistory = history
    .filter((item) => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.details.toLowerCase().includes(searchLower) ||
          item.table.toLowerCase().includes(searchLower) ||
          item.command.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter((item) => {
      // Apply action type filter
      if (filterType === "all") return true;
      return item.action === filterType;
    })
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  if (loading) {
    return (
      <div className="bg-[#080808] min-h-screen text-white">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-[#ababab]">Loading history...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#080808] min-h-screen text-white">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Command History</h1>
          <p className="text-[#ababab]">
            View and manage your past database operations and commands
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-[#262626] rounded-xl p-6 border border-[#333] mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ababab]"
                size={18}
              />
              <Input
                placeholder="Search history..."
                className="bg-[#1a1a1a] border-[#333] text-white pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-[#ababab]" />
              <select
                className="bg-[#1a1a1a] border border-[#333] rounded-md p-2 text-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Actions</option>
                <option value="insert">Inserts Only</option>
                <option value="update">Updates Only</option>
                <option value="delete">Deletes Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="bg-[#262626] rounded-xl p-6 border border-[#333]">
          <h2 className="text-xl font-medium mb-6">Recent Commands</h2>

          <div className="flex justify-end mb-4">
            <Button
              onClick={fetchHistory}
              className="bg-[#262626] hover:bg-[#333] text-white flex items-center gap-2"
              size="sm"
            >
              <RefreshCw size={14} />
              Refresh
            </Button>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto mb-4 text-[#ababab]" />
              <p className="text-[#ababab]">
                {loading
                  ? "Loading history..."
                  : "No history found matching your filters"}
              </p>
              {!loading && history.length === 0 && (
                <p className="text-[#ababab] mt-2">
                  No database operations have been recorded yet. Try creating or
                  modifying some data first.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] hover:border-[#ff004f] transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getActionIcon(item.action)}
                      <span
                        className={`font-medium ${getActionColor(item.action)}`}
                      >
                        {item.action.charAt(0).toUpperCase() +
                          item.action.slice(1)}
                      </span>
                      <span className="text-[#ababab] text-sm">•</span>
                      <div className="flex items-center gap-1">
                        <Database size={14} className="text-[#ababab]" />
                        <span className="text-[#ababab] text-sm">
                          {item.table}
                        </span>
                      </div>
                    </div>
                    <span className="text-[#ababab] text-xs">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                  <p className="mb-2">{item.details}</p>
                  <div className="bg-[#262626] p-2 rounded text-sm text-[#ababab] font-mono">
                    "{item.command}"
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#ababab] hover:text-[#ff004f] hover:bg-transparent"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
