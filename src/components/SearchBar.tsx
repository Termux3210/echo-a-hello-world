
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export function SearchBar({ 
  placeholder = "Поиск...", 
  onSearch,
  className 
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  
  const handleSearch = () => {
    if (onSearch) {
      onSearch(query);
    }
  };
  
  const handleClear = () => {
    setQuery("");
    if (onSearch) {
      onSearch("");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  return (
    <div 
      className={cn(
        "flex items-center w-full relative rounded-full",
        "bg-secondary px-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all",
        className
      )}
    >
      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full py-2 px-3 bg-transparent border-none focus:outline-none text-sm"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default SearchBar;
