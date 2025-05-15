import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play } from "lucide-react";

export default async function VoiceQuery() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="bg-[#080808] min-h-screen text-white">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Voice Query</h1>
          <p className="text-[#ababab]">
            Ask questions about your data using natural language
          </p>
        </div>

        <div className="bg-[#262626] rounded-xl p-6 border border-[#333] mb-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border-4 border-[#ff004f] flex items-center justify-center mb-6">
              <Mic size={40} className="text-[#ff004f]" />
            </div>
            <p className="text-[#ababab] mb-6 text-center max-w-md">
              Press the button and ask a question about your data
            </p>
            <div className="flex gap-4">
              <Button className="bg-[#ff004f] hover:bg-[#e0003f] text-white flex items-center gap-2 px-6">
                <Mic size={16} />
                Start Recording
              </Button>
              <Button
                variant="outline"
                className="border-[#333] text-white hover:bg-[#1a1a1a] flex items-center gap-2"
                disabled
              >
                <MicOff size={16} />
                Stop
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-[#262626] rounded-xl p-6 border border-[#333] mb-8">
          <h2 className="text-xl font-medium mb-4">Transcription</h2>
          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333] min-h-24 flex items-center justify-center">
            <p className="text-[#ababab] italic">
              Your voice query will appear here...
            </p>
          </div>
        </div>

        <div className="bg-[#262626] rounded-xl p-6 border border-[#333]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Generated SQL</h2>
            <Button
              variant="outline"
              className="border-[#ff004f] text-[#ff004f] hover:bg-[#ff004f]/10 flex items-center gap-2"
              disabled
            >
              <Play size={16} />
              Execute Query
            </Button>
          </div>
          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333] font-mono text-sm overflow-x-auto">
            <p className="text-[#ababab] italic">
              SQL query will appear here...
            </p>
          </div>
        </div>

        <div className="mt-8 bg-[#262626] rounded-xl p-6 border border-[#333]">
          <h2 className="text-xl font-medium mb-4">Results</h2>
          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333] text-center">
            <p className="text-[#ababab]">
              No results yet. Ask a question to see data here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
