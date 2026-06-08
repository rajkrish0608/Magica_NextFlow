"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  MoreHorizontal, Pencil, Trash2, ExternalLink, Upload, Search,
  MessageSquare, FolderOpen, BarChart3, Workflow, Share2, Braces, Settings,
  Gift, Plus, ChevronDown, ChevronUp, PanelLeft, PlusSquare, Play, Puzzle
} from "lucide-react";
import Link from "next/link";
import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";

import WorkflowGrid from "@/components/WorkflowGrid";
import WorkflowCard from "@/components/WorkflowCard";

interface WorkflowItem {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bottomExpanded, setBottomExpanded] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    console.log("[NextFlow] Candidate LinkedIn: https://www.linkedin.com/in/rajkrishbuilds/");
    const load = async () => {
      await fetch("/api/seed-sample", { method: "POST" }).catch(() => {});
      const res = await fetch("/api/workflows");
      const d = await res.json();
      setWorkflows(d.workflows || []);
      setLoading(false);
    };
    load();
  }, []);

  const openSampleWorkflow = async () => {
    const existing = workflows.find(w => w.name === "Trial Task Workflow");
    if (existing) {
      router.push(`/workflow/${existing.id}`);
      return;
    }
    const res = await fetch("/api/seed-sample", { method: "POST" });
    const data = await res.json();
    if (data.workflow) router.push(`/workflow/${data.workflow.id}`);
  };

  const createWorkflow = async () => {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Untitled Workflow" }),
    });
    const data = await res.json();
    router.push(`/workflow/${data.workflow.id}`);
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm("Delete this workflow?")) return;
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    setWorkflows((p) => p.filter((w) => w.id !== id));
    setMenuOpen(null);
  };

  const submitRename = async (id: string) => {
    if (!renamingValue.trim()) return;
    await fetch(`/api/workflows/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renamingValue }),
    });
    setWorkflows((p) => p.map((w) => (w.id === id ? { ...w, name: renamingValue } : w)));
    setRenaming(null);
  };

  const importWorkflow = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name.replace(".json", ""), nodes: parsed.nodes, edges: parsed.edges }),
      });
      const data = await res.json();
      router.push(`/workflow/${data.workflow.id}`);
    } catch { alert("Invalid workflow JSON"); }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: <MessageSquare size={18} strokeWidth={1.5} />, label: "Tasks" },
    { icon: <FolderOpen size={18} strokeWidth={1.5} />, label: "Projects" },
    { icon: <BarChart3 size={18} strokeWidth={1.5} />, label: "Library" },
    { icon: <Workflow size={18} strokeWidth={1.5} />, label: "Flow", active: true },
    { icon: <Share2 size={18} strokeWidth={1.5} />, label: "Nodes" },
    { icon: <Braces size={18} strokeWidth={1.5} />, label: "API / MCP" },
  ];

  return (
    <div className="font-brand flex flex-col h-screen overflow-hidden bg-background">
      <TopBanner />
      
      <div className="flex flex-1 mt-14 overflow-hidden site-scrollbar">
        {/* EXPANDED SIDEBAR */}
        {sidebarOpen ? (
          <aside className="group/sidebar flex w-64 flex-col bg-sidebar dark:bg-[#141416] transition-all duration-300 z-10">
            {/* Logo + toggle */}
            <div className="flex h-16 items-center justify-between px-6 shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <img src="https://magica.com/app/_next/image?url=%2Fapp%2Ficon.png&w=48&q=75" alt="Magica" className="h-6 w-6 dark:invert" />
                <img src="https://magica.com/app/_next/image?url=%2Fapp%2Fgalaxy.png&w=256&q=75" alt="Magica" className="h-5 object-contain dark:invert" />
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-muted-foreground hover:bg-accent hover:text-foreground p-1 rounded-md transition-colors"
              >
                <PanelLeft size={16} strokeWidth={1.6} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 p-3 shrink-0">
              <button onClick={createWorkflow} className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <PlusSquare size={18} />
                New task
                <span className="ml-auto text-xs text-muted-foreground">⌘⇧O</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Search size={18} />
                Search tasks
                <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
              </button>
            </div>

            <div className="h-[1px] bg-border/50 mx-4 shrink-0" />

            {/* Nav */}
            <div className="flex-1 flex flex-col overflow-y-auto px-3 py-2 hide-scrollbar">
              <div className="flex flex-col gap-1">
                {navItems.map(item => (
                  <button key={item.label} className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-colors ${item.active ? 'bg-[#ededed] dark:bg-accent font-semibold text-foreground' : 'font-medium text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                    <span className={`${item.active ? 'text-primary' : 'text-muted-foreground'}`}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 flex items-center justify-center min-h-[100px]">
                <p className="text-sm text-muted-foreground/60">No tasks yet</p>
              </div>
            </div>

            {/* Bottom section */}
            <div className="p-4 border-t border-border/50 shrink-0 flex flex-col items-center">
              {bottomExpanded && (
                <div className="w-full flex flex-col gap-2 mb-2">
                  <button className="w-full flex items-center justify-center gap-2 rounded-[18px] bg-[#f8f8f7] dark:bg-muted border border-border py-2 text-sm font-medium text-foreground hover:bg-accent transition-all">
                    <Settings size={16} />
                    Settings
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#7c3aed] py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                    <Gift size={16} />
                    Claim Offer
                  </button>
                </div>
              )}
              
              <button onClick={() => setBottomExpanded(!bottomExpanded)} className="text-muted-foreground hover:text-foreground p-1 mb-2 transition-colors">
                {bottomExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              
              {/* User row */}
              <div className="flex items-center gap-3 mt-1">
                <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />
                <span className="text-sm font-bold text-foreground">{user?.fullName || user?.firstName || "User"}</span>
              </div>
            </div>
          </aside>
        ) : (
          /* COLLAPSED SIDEBAR */
          <aside className="flex w-14 flex-col items-center bg-sidebar dark:bg-[#141416] py-3 z-10 transition-all duration-300">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="group/logo relative flex h-8 w-8 items-center justify-center rounded-md mb-4 hover:bg-accent transition-colors"
              title="Open sidebar"
            >
              <img src="https://magica.com/app/_next/image?url=%2Fapp%2Ficon.png&w=48&q=75" alt="Magica" className="h-6 w-6 dark:invert absolute transition-opacity duration-200 group-hover/logo:opacity-0" />
              <PanelLeft size={16} strokeWidth={1.6} className="text-foreground absolute opacity-0 transition-opacity duration-200 group-hover/logo:opacity-100" />
            </button>
            <button onClick={createWorkflow} className="text-muted-foreground hover:bg-accent hover:text-foreground p-2 rounded-md transition-colors mb-1">
              <Plus size={16} strokeWidth={1.8} />
            </button>
            <button className="text-muted-foreground hover:bg-accent hover:text-foreground p-2 rounded-md transition-colors mb-2">
              <Search size={16} strokeWidth={1.8} />
            </button>
            <div className="w-6 h-[1px] bg-border/50 mb-2" />
            {navItems.map(item => (
              <button key={item.label} className={`p-2 rounded-[10px] mb-1 transition-colors ${item.active ? 'bg-[#ededed] dark:bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                {item.icon}
              </button>
            ))}
            <div className="flex-1" />
            <button className="text-muted-foreground hover:bg-accent hover:text-foreground p-2 rounded-md transition-colors">
              <Settings size={16} strokeWidth={1.5} />
            </button>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background relative z-0">
          
          <header className="flex h-16 shrink-0 items-center justify-between bg-background px-8">
            <div className="flex flex-col">
              <h1 className="font-brand text-2xl font-bold tracking-tight text-foreground leading-tight">Flow</h1>
              <p className="text-xs text-muted-foreground">Build workflows or run models directly.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer shadow-sm">
                <Upload size={14} /> Import
                <input type="file" accept=".json" onChange={importWorkflow} className="hidden" />
              </label>
              <button onClick={createWorkflow} className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#111] text-white hover:bg-[#333] transition-colors shadow-sm">
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-8 py-8 site-scrollbar">
            


            <div className="mb-14">
              <div className="flex flex-col mb-6">
                <h2 className="font-brand text-lg font-bold text-foreground">System Workflows</h2>
                <p className="text-sm text-muted-foreground mt-1">Pre-built workflow templates — click to open and start using.</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,320px))] gap-6">
                <div onClick={openSampleWorkflow} className="w-full">
                  <WorkflowCard 
                    title="AI Racing Car Generator" 
                    imageSrc="https://magica.com/app/_next/image?url=https%3A%2F%2Fgalaxy-prod.tlcdn.com%2Fpreview-assets%2Fimage%2Fsystem-workflow-thumbnail%2Fuuid-v4-folder%2Ffb5a9379-250e-4237-8cfd-09a9fbcc2eac.jpg%3Fhsh%3Doptimize&w=640&q=75" 
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <h2 className="font-brand text-lg font-bold text-foreground">Your Workflows</h2>
                  <p className="text-sm text-muted-foreground mt-1">Open one to edit, run, and review history.</p>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Search workflows..."
                    className="w-48 rounded-[10px] border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring shadow-sm transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,320px))] gap-6">
                {loading ? (
                  <>
                    {[1, 2, 3].map(i => <div key={i} className="aspect-[16/10] rounded-[18px] bg-muted animate-pulse" />)}
                  </>
                ) : filtered.length === 0 ? (
                  <div className="col-span-full p-8 flex flex-col gap-2 items-center text-center rounded-[18px] border border-border bg-card">
                    <p className="font-brand text-lg font-bold text-foreground">No workflows yet</p>
                    <p className="text-sm text-muted-foreground">Create your first workflow to start building.</p>
                    <button onClick={createWorkflow} className="mt-4 rounded-[10px] bg-[#111] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#333] transition-colors shadow-sm">
                      Create workflow
                    </button>
                  </div>
                ) : (
                  <>
                    {filtered.map((w, idx) => (
                      <div key={w.id} className="group cursor-pointer flex flex-col overflow-hidden rounded-[18px] border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300" onClick={() => renaming !== w.id && router.push(`/workflow/${w.id}`)}>
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                          <img src="https://magica.com/app/_next/image?url=https%3A%2F%2Fgalaxy-prod.tlcdn.com%2Fpreview-assets%2Fimage%2Fsystem-workflow-thumbnail%2Fuuid-v4-folder%2Ffb5a9379-250e-4237-8cfd-09a9fbcc2eac.jpg%3Fhsh%3Doptimize&w=640&q=75" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Workflow thumbnail" />
                          
                          {/* Top-left icon */}
                          <div className="absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-[6px] bg-black/30 backdrop-blur-sm text-white">
                            <Workflow size={12} />
                          </div>

                          {/* Top-right menu */}
                          <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setMenuOpen(menuOpen === w.id ? null : w.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors">
                              <MoreHorizontal size={14} />
                            </button>
                            {menuOpen === w.id && (
                              <div className="absolute right-0 top-full mt-1 w-40 rounded-[12px] border border-border bg-card p-1 shadow-md z-50 text-foreground">
                                <button onClick={() => { setMenuOpen(null); router.push(`/workflow/${w.id}`); }} className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                                  <ExternalLink size={14} /> Open
                                </button>
                                <button onClick={() => { setRenaming(w.id); setRenamingValue(w.name); setMenuOpen(null); }} className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors">
                                  <Pencil size={14} /> Rename
                                </button>
                                <button onClick={() => { setMenuOpen(null); deleteWorkflow(w.id); }} className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {w.status === "running" && (
                            <div className="absolute bottom-3 right-3">
                              <span className="rounded-full bg-green-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white shadow-sm uppercase tracking-wide">Running</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col p-3.5">
                          {renaming === w.id ? (
                            <input autoFocus value={renamingValue} onChange={e => setRenamingValue(e.target.value)}
                              onBlur={() => submitRename(w.id)}
                              onKeyDown={e => { if (e.key === "Enter") submitRename(w.id); if (e.key === "Escape") setRenaming(null); }}
                              onClick={e => e.stopPropagation()}
                              className="flex-1 rounded-[8px] border border-primary px-3 py-1.5 text-sm font-medium outline-none" 
                            />
                          ) : (
                            <h3 className="font-brand text-sm font-semibold text-foreground line-clamp-1">{w.name}</h3>
                          )}
                          <p className="mt-1 text-[11px] text-muted-foreground">Edited {formatDate(w.updatedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            
          </div>
        </main>
      </div>
      
      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
