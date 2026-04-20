import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListPlayers, useGetLeaderboardSummary, useListGamemodes } from "@workspace/api-client-react";
import { Gamemode } from "@workspace/api-client-react/src/generated/api.schemas";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TierBadge } from "@/components/ui/tier-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Filter, Trophy, Users, Activity, Crown, SearchX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  const [search, setSearch] = useState("");
  const [gamemode, setGamemode] = useState<string>("all");

  const { data: summary, isLoading: isLoadingSummary } = useGetLeaderboardSummary();
  const { data: gamemodes } = useListGamemodes();
  
  // Debounce search slightly for the API call
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Use a simple timeout for debouncing
  useMemo(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: players, isLoading: isLoadingPlayers } = useListPlayers({
    search: debouncedSearch || undefined,
    gamemode: gamemode !== "all" ? (gamemode as Gamemode) : undefined,
  }, {
    query: {
      queryKey: ["/api/players", { search: debouncedSearch || undefined, gamemode: gamemode !== "all" ? gamemode : undefined }]
    }
  });

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
      <Navbar />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center py-12 gap-4 relative">
          <div className="absolute inset-0 top-1/2 -translate-y-1/2 bg-primary/5 blur-[120px] rounded-full w-full h-[200px] -z-10 pointer-events-none" />
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-3 py-1 font-medium glow-primary tracking-wide">
            OFFICIAL RANKINGS
          </Badge>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-foreground uppercase">
            THE <span className="text-primary glow-text">APEX</span> OF PVP
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mt-2 font-medium">
            Competitive Minecraft duels, tracked and tiered. Prove your skill in the arena and climb the global ranks.
          </p>
        </section>

        {/* Summary Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Duelists</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{summary?.totalPlayers || 0}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Modes</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{gamemodes?.length || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 bg-gradient-to-br from-card/80 to-primary/5 border-primary/20 relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-primary">Global #1</CardTitle>
              <Crown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="relative z-10">
              {isLoadingSummary ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ) : summary?.topPlayer ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <PlayerAvatar username={summary.topPlayer.name} size="md" className="border-primary/50 shadow-[0_0_15px_-3px_hsla(var(--primary)/0.3)]" />
                    <div>
                      <div className="text-2xl font-black tracking-tight">{summary.topPlayer.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <TierBadge tier={summary.topPlayer.tier} size="sm" />
                        <span className="text-xs text-muted-foreground font-mono">{summary.topPlayer.points} PTS</span>
                      </div>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="secondary" className="hidden sm:flex">
                    <Link href={`/player/${summary.topPlayer.id}`}>View Profile</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-xl font-bold text-muted-foreground">No players ranked</div>
              )}
            </CardContent>
            <div className="absolute right-0 bottom-0 opacity-5 w-32 h-32 translate-x-8 translate-y-8 pointer-events-none">
              <Crown className="w-full h-full" />
            </div>
          </Card>
        </section>

        {/* Filters and Table */}
        <section className="flex flex-col gap-6" data-testid="section-leaderboard">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              RANKINGS
            </h2>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search players..." 
                  className="pl-9 bg-card/50 border-border/50 focus-visible:ring-primary/50 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Select value={gamemode} onValueChange={setGamemode}>
                <SelectTrigger className="w-full sm:w-48 bg-card/50 border-border/50" data-testid="select-gamemode">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="All Gamemodes" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gamemodes</SelectItem>
                  {gamemodes?.map((mode) => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground uppercase font-mono text-[11px] tracking-wider border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-16 text-center">#</th>
                    <th className="px-6 py-4 font-semibold">Player</th>
                    <th className="px-6 py-4 font-semibold">Tier</th>
                    <th className="px-6 py-4 font-semibold hidden md:table-cell">Mode</th>
                    <th className="px-6 py-4 font-semibold text-right">Points</th>
                    <th className="px-6 py-4 font-semibold w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {isLoadingPlayers ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={`skeleton-${i}`}>
                        <td className="px-6 py-4"><Skeleton className="h-5 w-5 mx-auto" /></td>
                        <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-5 w-24" /></div></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-12" /></td>
                        <td className="px-6 py-4 hidden md:table-cell"><Skeleton className="h-5 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-5 w-12 ml-auto" /></td>
                        <td className="px-6 py-4"></td>
                      </tr>
                    ))
                  ) : players?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <SearchX className="h-8 w-8 text-muted-foreground/50" />
                          <p>No players found matching your criteria.</p>
                          {(search || gamemode !== "all") && (
                            <Button variant="link" onClick={() => { setSearch(""); setGamemode("all"); }} className="text-primary mt-2">
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    players?.map((player, index) => (
                      <tr key={player.id} className="group hover:bg-muted/30 transition-colors" data-testid={`row-player-${player.id}`}>
                        <td className="px-6 py-4 text-center font-mono font-medium text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/player/${player.id}`} className="flex items-center gap-3 w-max">
                            <PlayerAvatar username={player.name} size="sm" />
                            <span className="font-bold hover:text-primary transition-colors">{player.name}</span>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <TierBadge tier={player.tier} />
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                          {player.gamemode}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold">
                          {player.points.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/player/${player.id}`}>
                              <span className="sr-only">View</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className="h-4 w-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
