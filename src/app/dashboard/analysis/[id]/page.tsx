"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "../../../../../supabase/client";
import { useState, useEffect } from "react";
import {
  ColumnDefinition,
  TableDefinition,
  tableService,
} from "@/lib/table-service";
import { useParams, useRouter } from "next/navigation";
import { BarChart3, LineChart, PieChart, ArrowLeft } from "lucide-react";

export default function TableAnalysisPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [table, setTable] = useState<TableDefinition | null>(null);
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartType, setChartType] = useState("pie"); // pie, bar, or line chart
  const [selectedColumn, setSelectedColumn] = useState("");
  const [numericColumns, setNumericColumns] = useState<ColumnDefinition[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchTableData();
      } else {
        window.location.href = "/sign-in";
      }
    };
    getUser();
  }, [supabase.auth]);

  const fetchTableData = async () => {
    setLoading(true);
    setError("");
    try {
      // Get table definition
      const tableData = await tableService.getTableById(tableId);
      setTable(tableData as TableDefinition);
      setColumns(tableData.schema as ColumnDefinition[]);

      // Find numeric columns for analysis
      const numCols = tableData.schema.filter(
        (col: ColumnDefinition) =>
          col.type === "integer" || col.type === "float",
      );
      setNumericColumns(numCols);
      if (numCols.length > 0) {
        setSelectedColumn(numCols[0].name);
      }

      // Get table entities
      const entities = await tableService.getEntities(tableId);
      setRows(entities);
    } catch (err) {
      console.error("Error fetching table data:", err);
      setError(
        "Failed to load table data: " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics for the selected column
  const calculateStats = () => {
    if (!selectedColumn || rows.length === 0)
      return { mean: 0, median: 0, mode: 0, min: 0, max: 0 };

    const values = rows
      .map((row) => parseFloat(row.data[selectedColumn] || 0))
      .filter((val) => !isNaN(val));

    if (values.length === 0)
      return { mean: 0, median: 0, mode: 0, min: 0, max: 0 };

    // Mean
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;

    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];

    // Mode
    const counts: { [key: number]: number } = {};
    let mode = values[0];
    let maxCount = 1;

    for (const value of values) {
      counts[value] = (counts[value] || 0) + 1;
      if (counts[value] > maxCount) {
        maxCount = counts[value];
        mode = value;
      }
    }

    // Min and Max
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { mean, median, mode, min, max };
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!selectedColumn || rows.length === 0) return [];

    // For salary or numeric data, create ranges
    if (
      selectedColumn === "salary" ||
      numericColumns.some((col) => col.name === selectedColumn)
    ) {
      const values = rows
        .map((row) => parseFloat(row.data[selectedColumn] || 0))
        .filter((val) => !isNaN(val));

      if (values.length === 0) return [];

      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const bucketSize = range / 5; // Create 5 buckets

      const buckets = [
        {
          name: `${min.toLocaleString()} - ${(min + bucketSize).toLocaleString()}`,
          value: 0,
          color: "#ff004f",
        },
        {
          name: `${(min + bucketSize).toLocaleString()} - ${(min + 2 * bucketSize).toLocaleString()}`,
          value: 0,
          color: "#ff3370",
        },
        {
          name: `${(min + 2 * bucketSize).toLocaleString()} - ${(min + 3 * bucketSize).toLocaleString()}`,
          value: 0,
          color: "#ff6691",
        },
        {
          name: `${(min + 3 * bucketSize).toLocaleString()} - ${(min + 4 * bucketSize).toLocaleString()}`,
          value: 0,
          color: "#ff99b2",
        },
        {
          name: `${(min + 4 * bucketSize).toLocaleString()} - ${max.toLocaleString()}`,
          value: 0,
          color: "#ffd1dd",
        },
      ];

      // Count values in each bucket
      for (const value of values) {
        // Prevent division by zero if min equals max
        if (bucketSize === 0) {
          buckets[0].value++;
          continue;
        }
        const bucketIndex = Math.min(Math.floor((value - min) / bucketSize), 4);
        if (buckets[bucketIndex]) {
          buckets[bucketIndex].value++;
        }
      }

      return buckets;
    }

    // For other columns, count occurrences
    const counts: { [key: string]: number } = {};
    for (const row of rows) {
      const value = String(row.data[selectedColumn] || "N/A");
      counts[value] = (counts[value] || 0) + 1;
    }

    // Convert to array format
    const colors = [
      "#ff004f",
      "#ff3370",
      "#ff6691",
      "#ff99b2",
      "#ffd1dd",
      "#ffecf1",
    ];
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  };

  // Render chart based on type
  const renderChart = () => {
    const data = prepareChartData();
    if (data.length === 0)
      return (
        <div className="text-center text-[#ababab]">
          No data available for chart
        </div>
      );

    const total = data.reduce((sum, item) => sum + item.value, 0);

    switch (chartType) {
      case "pie":
        return (
          <div className="relative h-80">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {
                  data.reduce(
                    (
                      elements: { paths: React.ReactNode[]; total: number },
                      item,
                      i,
                    ) => {
                      const percentage = (item.value / total) * 100;
                      const previousTotal = elements.total;
                      elements.total += percentage;

                      // Calculate the SVG arc path
                      const startAngle = (previousTotal / 100) * 360;
                      const endAngle = (elements.total / 100) * 360;

                      const x1 =
                        50 + 40 * Math.cos(((startAngle - 90) * Math.PI) / 180);
                      const y1 =
                        50 + 40 * Math.sin(((startAngle - 90) * Math.PI) / 180);
                      const x2 =
                        50 + 40 * Math.cos(((endAngle - 90) * Math.PI) / 180);
                      const y2 =
                        50 + 40 * Math.sin(((endAngle - 90) * Math.PI) / 180);

                      const largeArcFlag = percentage > 50 ? 1 : 0;

                      elements.paths.push(
                        <path
                          key={i}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={item.color}
                          stroke="#262626"
                          strokeWidth="0.5"
                        />,
                      );

                      return elements;
                    },
                    { paths: [] as React.ReactNode[], total: 0 } as {
                      paths: React.ReactNode[];
                      total: number;
                    },
                  ).paths
                }
              </svg>
            </div>

            <div className="absolute bottom-0 left-0 right-0">
              <div className="flex flex-wrap justify-center gap-4">
                {data.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs">
                      {item.name}: {((item.value / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "bar":
        const maxValue = Math.max(...data.map((item) => item.value));
        return (
          <div className="h-80 flex items-end justify-around gap-2 pt-10 pb-10">
            {data.map((item, i) => {
              const height = (item.value / maxValue) * 100;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-12 rounded-t-md"
                    style={{
                      height: `${height}%`,
                      backgroundColor: item.color,
                      minHeight: "10px",
                    }}
                  ></div>
                  <div
                    className="text-xs mt-2 text-center w-16 truncate"
                    title={item.name}
                  >
                    {item.name}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "line":
        // For line chart, we need ordered data
        const sortedData = [...data].sort((a, b) => {
          // Try to sort numerically if possible
          const numA = parseFloat(a.name);
          const numB = parseFloat(b.name);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.name.localeCompare(b.name);
        });

        const maxLineValue = Math.max(...sortedData.map((item) => item.value));
        const points = sortedData.map((item, i, arr) => {
          const x = (i / (arr.length - 1 || 1)) * 90 + 5; // 5% to 95% of width
          const y = 100 - (item.value / maxLineValue) * 80; // 20% to 100% of height
          return { x, y, ...item };
        });

        return (
          <div className="h-80 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* X and Y axes */}
              <line
                x1="5"
                y1="80"
                x2="95"
                y2="80"
                stroke="#333"
                strokeWidth="0.5"
              />
              <line
                x1="5"
                y1="20"
                x2="5"
                y2="80"
                stroke="#333"
                strokeWidth="0.5"
              />

              {/* Line */}
              <polyline
                points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#ff004f"
                strokeWidth="1"
              />

              {/* Points */}
              {points.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="1.5"
                  fill="#ff004f"
                />
              ))}
            </svg>

            <div className="absolute bottom-0 left-0 right-0">
              <div className="flex justify-between px-5">
                {sortedData.map((item, i) => (
                  <div
                    key={i}
                    className="text-xs transform -rotate-45 origin-top-left"
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a chart type</div>;
    }
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="bg-[#080808] min-h-screen text-white">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-[#ababab]">Loading analysis data...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#080808] min-h-screen text-white">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analysis: {table?.name}</h1>
            <p className="text-[#ababab]">
              Visualize and analyze your data with powerful charts
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/analysis")}
            className="bg-[#262626] hover:bg-[#333] text-white flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Analysis
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            className={`bg-[#262626] p-6 rounded-xl border ${chartType === "pie" ? "border-[#ff004f]" : "border-[#333]"} flex flex-col items-center cursor-pointer`}
            onClick={() => setChartType("pie")}
          >
            <PieChart
              size={48}
              className={`${chartType === "pie" ? "text-[#ff004f]" : "text-white"} mb-4`}
            />
            <h3 className="text-xl font-medium mb-2">Pie Chart</h3>
            <p className="text-[#ababab] text-center text-sm">
              Show proportion and distribution
            </p>
          </div>

          <div
            className={`bg-[#262626] p-6 rounded-xl border ${chartType === "bar" ? "border-[#ff004f]" : "border-[#333]"} flex flex-col items-center cursor-pointer`}
            onClick={() => setChartType("bar")}
          >
            <BarChart3
              size={48}
              className={`${chartType === "bar" ? "text-[#ff004f]" : "text-white"} mb-4`}
            />
            <h3 className="text-xl font-medium mb-2">Bar Chart</h3>
            <p className="text-[#ababab] text-center text-sm">
              Compare values across categories
            </p>
          </div>

          <div
            className={`bg-[#262626] p-6 rounded-xl border ${chartType === "line" ? "border-[#ff004f]" : "border-[#333]"} flex flex-col items-center cursor-pointer`}
            onClick={() => setChartType("line")}
          >
            <LineChart
              size={48}
              className={`${chartType === "line" ? "text-[#ff004f]" : "text-white"} mb-4`}
            />
            <h3 className="text-xl font-medium mb-2">Line Chart</h3>
            <p className="text-[#ababab] text-center text-sm">
              Track changes over time or sequence
            </p>
          </div>
        </div>

        <div className="bg-[#262626] rounded-xl p-6 border border-[#333] mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium">Data Visualization</h2>

            <div className="flex items-center gap-2">
              <label htmlFor="columnSelect" className="text-[#ababab]">
                Select column:
              </label>
              <select
                id="columnSelect"
                className="bg-[#1a1a1a] border border-[#333] rounded-md p-2 text-white"
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
              >
                {columns.map((column) => (
                  <option key={column.name} value={column.name}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333] min-h-[300px]">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-[#ababab] mb-4">
                  No data available for visualization
                </p>
                <Button
                  onClick={() =>
                    router.push(`/dashboard/table-designer/${tableId}`)
                  }
                  className="bg-[#ff004f] hover:bg-[#e0003f] text-white"
                >
                  Add Data to Table
                </Button>
              </div>
            ) : (
              renderChart()
            )}
          </div>
        </div>

        <div className="bg-[#262626] rounded-xl p-6 border border-[#333]">
          <h2 className="text-xl font-medium mb-4">Statistical Summary</h2>
          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 border border-[#333] rounded-lg text-center">
                <p className="text-[#ababab] text-sm mb-1">Mean</p>
                <p className="text-2xl font-bold">{stats.mean.toFixed(2)}</p>
              </div>
              <div className="p-4 border border-[#333] rounded-lg text-center">
                <p className="text-[#ababab] text-sm mb-1">Median</p>
                <p className="text-2xl font-bold">{stats.median.toFixed(2)}</p>
              </div>
              <div className="p-4 border border-[#333] rounded-lg text-center">
                <p className="text-[#ababab] text-sm mb-1">Mode</p>
                <p className="text-2xl font-bold">{stats.mode.toFixed(2)}</p>
              </div>
              <div className="p-4 border border-[#333] rounded-lg text-center">
                <p className="text-[#ababab] text-sm mb-1">Min</p>
                <p className="text-2xl font-bold">{stats.min.toFixed(2)}</p>
              </div>
              <div className="p-4 border border-[#333] rounded-lg text-center">
                <p className="text-[#ababab] text-sm mb-1">Max</p>
                <p className="text-2xl font-bold">{stats.max.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
