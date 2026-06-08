import Link from "next/link";
import { Folder, Play, Puzzle, PlusSquare, Search } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="group/sidebar flex w-64 flex-col border-r border-border/50 bg-[#F9F9F9] dark:bg-sidebar transition-all duration-300">
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          {/* We use a placeholder since actual SVG isn't downloaded */}
          <div className="h-6 w-6 rounded bg-primary"></div>
          <span className="font-brand font-bold text-lg tracking-tight">Magica</span>
        </Link>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors">
          <PlusSquare size={18} />
          New task
          <span className="ml-auto text-xs text-gray-400">⌘⇧O</span>
        </button>
        <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors">
          <Search size={18} />
          Search tasks
          <span className="ml-auto text-xs text-gray-400">⌘K</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="flex flex-col gap-1">
          <Link href="/tasks" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors">
            <span className="h-2 w-2 rounded-full bg-gray-300"></span> Tasks
          </Link>
          <Link href="/projects" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors">
            <Folder size={18} /> Projects
          </Link>
          <Link href="/library" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors">
            <span className="h-2 w-2 rounded-full bg-gray-300"></span> Library
          </Link>
          <Link href="/flow" className="flex items-center gap-3 rounded-[10px] bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm">
            <Play size={18} /> Flow
          </Link>
          <Link href="/api" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors">
            <Puzzle size={18} /> API / MCP
          </Link>
        </div>
      </div>

      <div className="p-4 border-t border-border/50">
        <button className="w-full rounded-[18px] bg-white border border-border py-2 text-sm font-semibold text-foreground hover:bg-gray-50 shadow-sm transition-all">
          Sign In
        </button>
      </div>
    </aside>
  );
}
