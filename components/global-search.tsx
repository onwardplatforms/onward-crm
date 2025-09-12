"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, Users, Briefcase, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface SearchResult {
  id: string;
  type: "contact" | "company" | "deal" | "activity";
  title: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        console.log("Searching for:", debouncedQuery);
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        console.log("Search response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Search results:", data);
          setResults(data.results || []);
          setShowResults(true);
        } else {
          console.error("Search failed with status:", response.status);
          const errorText = await response.text();
          console.error("Error response:", errorText);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const getIcon = (type: string) => {
    switch (type) {
      case "contact":
        return <Users className="h-4 w-4" />;
      case "company":
        return <Building2 className="h-4 w-4" />;
      case "deal":
        return <Briefcase className="h-4 w-4" />;
      case "activity":
        return <Activity className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "contact":
        return "Contact";
      case "company":
        return "Company";
      case "deal":
        return "Deal";
      case "activity":
        return "Activity";
      default:
        return "";
    }
  };

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    setQuery("");
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={searchRef} className="w-full max-w-lg relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search contacts, companies, deals..."
          className="pl-8"
          value={query}
          onChange={(e) => {
            console.log("Input changed:", e.target.value);
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
        />
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-[400px] overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  className={cn(
                    "w-full px-3 py-2 flex items-start gap-3 hover:bg-accent text-left transition-colors",
                    selectedIndex === index && "bg-accent"
                  )}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="mt-0.5 text-muted-foreground">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{result.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="font-medium">{getTypeLabel(result.type)}</span>
                      {result.subtitle && ` • ${result.subtitle}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}