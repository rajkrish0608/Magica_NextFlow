import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="relative flex items-center">
      <Search className="absolute left-3 text-muted-foreground" size={16} />
      <input
        type="text"
        placeholder="Search workflows..."
        className="w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  );
}
