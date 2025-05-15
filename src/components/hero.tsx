import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Database,
  Mic,
  BarChart3,
  Table,
} from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-[#080808]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#080808] to-[#1a1a1a] opacity-30" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-8 tracking-tight">
              Create{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff004f] to-[#ff6b98]">
                Custom Databases
              </span>{" "}
              with AI Voice Analytics
            </h1>

            <p className="text-xl text-[#ababab] mb-12 max-w-2xl mx-auto leading-relaxed">
              Design your own database tables, populate them with data, and
              analyze insights through visualizations and natural language voice
              queries powered by AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-white bg-[#ff004f] rounded-lg hover:bg-[#e0003f] transition-colors text-lg font-medium"
              >
                Start Building
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="#features"
                className="inline-flex items-center px-8 py-4 text-white bg-transparent border border-[#ff004f] rounded-lg hover:bg-[#ff004f]/10 transition-colors text-lg font-medium"
              >
                See Features
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="flex flex-col items-center p-4 bg-[#262626] rounded-lg shadow-sm border border-[#333] hover:border-[#ff004f] transition-all">
                <div className="bg-[#1a1a1a] p-3 rounded-full mb-3">
                  <Table className="w-6 h-6 text-[#ff004f]" />
                </div>
                <span className="text-sm font-medium text-white">
                  Table Designer
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-[#262626] rounded-lg shadow-sm border border-[#333] hover:border-[#ff004f] transition-all">
                <div className="bg-[#1a1a1a] p-3 rounded-full mb-3">
                  <Database className="w-6 h-6 text-[#ff004f]" />
                </div>
                <span className="text-sm font-medium text-white">
                  Data Management
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-[#262626] rounded-lg shadow-sm border border-[#333] hover:border-[#ff004f] transition-all">
                <div className="bg-[#1a1a1a] p-3 rounded-full mb-3">
                  <BarChart3 className="w-6 h-6 text-[#ff004f]" />
                </div>
                <span className="text-sm font-medium text-white">
                  Visualizations
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-[#262626] rounded-lg shadow-sm border border-[#333] hover:border-[#ff004f] transition-all">
                <div className="bg-[#1a1a1a] p-3 rounded-full mb-3">
                  <Mic className="w-6 h-6 text-[#ff004f]" />
                </div>
                <span className="text-sm font-medium text-white">
                  Voice Queries
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
