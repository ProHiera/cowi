"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DomainResult {
  domain: string;
  price: string;
  available: boolean;
}

const MOCK_RESULTS: DomainResult[] = [
  { domain: "flowos.app", price: "$12 / yr", available: true },
  { domain: "flowos.dev", price: "$18 / yr", available: false },
  { domain: "flowos.cloud", price: "$25 / yr", available: true },
];

export function DomainSearchPanel() {
  const [query, setQuery] = useState("flow-os");
  const [results, setResults] = useState(MOCK_RESULTS);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: integrate Namecheap/Route53 API here.
    setResults(MOCK_RESULTS.map((result) => ({ ...result, domain: `${query}.${result.domain.split(".")[1]}` })));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain search</CardTitle>
        <CardDescription>Mock lookup today. Plug in a provider API later.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="example"
            className="max-w-xs"
          />
          <Button type="submit">Search domain</Button>
        </form>
        <div className="mt-4 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.domain}>
                  <TableCell className="font-medium">{result.domain}</TableCell>
                  <TableCell>{result.price}</TableCell>
                  <TableCell>
                    {result.available ? (
                      <span className="text-emerald-600">Available</span>
                    ) : (
                      <span className="text-muted-foreground">Taken</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://domains.google" target="_blank" rel="noreferrer">
                        Go to purchase
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
