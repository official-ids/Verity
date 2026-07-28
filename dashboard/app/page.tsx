import { getTools } from "@/lib/tools";
import Header from "./Header";
import ProjectsList from "./ProjectsList";

export default function Dashboard() {
  const tools = getTools();

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        
        <Header />

        <ProjectsList tools={tools} />

        {tools.length === 0 && (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/40">Добавь проекты в tools.txt</p>
          </div>
        )}

      </div>
    </main>
  );
}