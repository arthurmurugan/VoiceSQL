"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  tableService,
  TableDefinition,
  ColumnDefinition,
} from "@/lib/table-service";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function TableDesigner() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tableName, setTableName] = useState("");
  const [tableDescription, setTableDescription] = useState("");
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { name: "id", type: "integer", required: true },
    { name: "name", type: "string", required: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      } else {
        window.location.href = "/sign-in";
      }
    };
    getUser();
  }, [supabase.auth]);

  const addColumn = () => {
    setColumns([...columns, { name: "", type: "string", required: false }]);
  };

  const removeColumn = (index: number) => {
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate column names are unique
      const columnNames = columns.map((col) => col.name);
      const uniqueNames = new Set(columnNames);
      if (uniqueNames.size !== columnNames.length) {
        throw new Error("Column names must be unique");
      }

      // Create the table definition
      const tableDefinition: TableDefinition = {
        name: tableName,
        description: tableDescription,
        schema: columns,
      };

      const result = await tableService.createTable(tableDefinition);
      router.push(`/dashboard/table-designer/${result.id}`);
    } catch (err) {
      console.error("Error creating table:", err);
      setError(err.message || "Failed to create table");
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold mb-2">Table Designer</h1>
          <p className="text-[#ababab]">
            Create custom tables with dynamic attributes
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-[#262626] rounded-xl p-6 border border-[#333]">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <Label htmlFor="tableName" className="text-white mb-2 block">
                Table Name
              </Label>
              <Input
                id="tableName"
                placeholder="Enter table name"
                className="bg-[#1a1a1a] border-[#333] text-white"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <Label
                htmlFor="tableDescription"
                className="text-white mb-2 block"
              >
                Description (Optional)
              </Label>
              <Textarea
                id="tableDescription"
                placeholder="Enter table description"
                className="bg-[#1a1a1a] border-[#333] text-white"
                value={tableDescription}
                onChange={(e) => setTableDescription(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium">Columns</h3>
                <Button
                  type="button"
                  className="bg-[#ff004f] hover:bg-[#e0003f] text-white flex items-center gap-2"
                  onClick={addColumn}
                >
                  <PlusCircle size={16} />
                  Add Column
                </Button>
              </div>

              <div className="space-y-4">
                {columns.map((column, index) => (
                  <div
                    key={index}
                    className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] flex flex-wrap gap-4 items-end"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <Label
                        htmlFor={`columnName-${index}`}
                        className="text-white mb-2 block"
                      >
                        Column Name
                      </Label>
                      <Input
                        id={`columnName-${index}`}
                        placeholder="Enter column name"
                        className="bg-[#262626] border-[#333] text-white"
                        value={column.name}
                        onChange={(e) =>
                          updateColumn(index, "name", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Label
                        htmlFor={`dataType-${index}`}
                        className="text-white mb-2 block"
                      >
                        Data Type
                      </Label>
                      <select
                        id={`dataType-${index}`}
                        className="w-full bg-[#262626] border border-[#333] rounded-md p-2 text-white"
                        value={column.type}
                        onChange={(e) =>
                          updateColumn(index, "type", e.target.value)
                        }
                      >
                        <option value="string">String</option>
                        <option value="integer">Integer</option>
                        <option value="float">Float</option>
                        <option value="date">Date</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 h-10">
                      <Checkbox
                        id={`required-${index}`}
                        checked={column.required}
                        onCheckedChange={(checked) =>
                          updateColumn(index, "required", checked)
                        }
                      />
                      <Label
                        htmlFor={`required-${index}`}
                        className="text-white"
                      >
                        Required
                      </Label>
                    </div>
                    <div className="ml-auto">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="bg-transparent hover:bg-[#ff004f]/10 border border-[#ff004f] text-[#ff004f]"
                        onClick={() => removeColumn(index)}
                        disabled={columns.length <= 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-[#ff004f] hover:bg-[#e0003f] text-white px-6"
                disabled={
                  loading ||
                  !tableName ||
                  columns.length === 0 ||
                  columns.some((col) => !col.name)
                }
              >
                {loading ? "Creating..." : "Create Table"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
