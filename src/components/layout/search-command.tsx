"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { QUERY_KEYS, STALE_TIMES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type StockSearchResult = {
  ticker: string;
  name: string;
  exchange: string;
};

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: results } = useQuery<StockSearchResult[]>({
    queryKey: QUERY_KEYS.stockSearch(debouncedQuery),
    queryFn: () =>
      fetch(`/api/stocks/search?q=${encodeURIComponent(debouncedQuery)}`).then(
        (r) => r.json()
      ),
    enabled: debouncedQuery.length >= 1,
    staleTime: STALE_TIMES.QUOTE,
  });

  const handleSelect = (ticker: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/stock/${ticker}`);
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative w-full max-w-[220px] justify-start text-sm text-muted-foreground sm:max-w-xs md:w-64"
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search stocks...
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search stocks and ETFs..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {debouncedQuery.length < 1
              ? "Type to search..."
              : "No results found."}
          </CommandEmpty>
          {results && Array.isArray(results) && results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((r, index) => (
                <CommandItem
                  key={`${r.ticker}-${r.exchange}-${index}`}
                  value={`${r.ticker} ${r.name}`}
                  onSelect={() => handleSelect(r.ticker)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{r.ticker}</span>
                    <span className="text-sm text-muted-foreground">
                      {r.name}
                    </span>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {r.exchange}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
