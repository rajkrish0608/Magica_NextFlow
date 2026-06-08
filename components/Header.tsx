import SearchBar from "./SearchBar";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-background px-6">
      <div className="flex flex-col">
        <h1 className="font-brand text-2xl font-bold tracking-tight text-foreground">
          Flow
        </h1>
        <p className="text-sm text-muted-foreground">
          Build workflows or run models directly.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <SearchBar />
        <button className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Import
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          +
        </button>
      </div>
    </header>
  );
}
