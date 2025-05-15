import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { ArrowUpRight, Database, Table, BarChart3, Mic } from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-[#ababab] max-w-2xl mx-auto">
              Create, manage, and analyze your custom databases with our
              intuitive platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0 bg-[#262626] p-3 h-fit rounded-lg">
                <Table className="w-6 h-6 text-[#ff004f]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Table Designer</h3>
                <p className="text-[#ababab]">
                  Create custom tables with multiple data types including
                  String, Integer, Float, and Date through an intuitive
                  interface.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 bg-[#262626] p-3 h-fit rounded-lg">
                <Database className="w-6 h-6 text-[#ff004f]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Data Entry</h3>
                <p className="text-[#ababab]">
                  Add and edit rows with appropriate input validation based on
                  column types, ensuring data integrity.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 bg-[#262626] p-3 h-fit rounded-lg">
                <BarChart3 className="w-6 h-6 text-[#ff004f]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Analysis Dashboard
                </h3>
                <p className="text-[#ababab]">
                  Visualize your data with dynamic charts and get statistical
                  summaries including mean, median, mode, max, and min.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 bg-[#262626] p-3 h-fit rounded-lg">
                <Mic className="w-6 h-6 text-[#ff004f]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Voice Query</h3>
                <p className="text-[#ababab]">
                  Ask questions about your data using natural language. Our AI
                  converts your voice to SQL queries for instant insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[#080808]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-[#ababab] max-w-2xl mx-auto">
              Build your custom database in minutes with our simple workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="bg-[#ff004f] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Design Your Table</h3>
              <p className="text-[#ababab]">
                Name your table and define columns with different data types
                through our intuitive form.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-[#ff004f] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Your Data</h3>
              <p className="text-[#ababab]">
                Populate your table with data using our data entry component
                with built-in validation.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-[#ff004f] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyze with Voice</h3>
              <p className="text-[#ababab]">
                Ask questions in natural language and get instant insights
                through visualizations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#121212]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Your Database?
          </h2>
          <p className="text-[#ababab] mb-8 max-w-2xl mx-auto">
            Create custom tables, add data, and analyze with voice queries in
            minutes.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-[#ff004f] rounded-lg hover:bg-[#e0003f] transition-colors"
          >
            Start Building Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
