import { useParams } from "wouter";
import { Link } from "wouter";
import { useGetPlayer } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TierBadge } from "@/components/ui/tier-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Trophy, Sword, Target, Shield, Flame } from "lucide-react";
import { format } from "date-fns";
import NotFound from "@/pages/not-found";

export default function PlayerProfile() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: player, isLoading, isError } = useGetPlayer(id, {
    query: { enabled: !!id, queryKey: ["/api/players", id] }
  });

  if (isError) {
    return <NotFound />;
  }

  // Visual mapping for gamemodes to give the profile more flavor
  const gamemodeIcons: Record<string, React.ReactNode> = {
    Sword: <Sword className="h-5 w-5 text-primary" />,
    Axe: <Target className="h-5 w-5 text-primary" />,
    Pot: <Flame className="h-5 w-5 text-primary" />,
    UHC: <Shield className="h-5 w-5 text-primary" />,
    Overall: <Trophy className="h-5 w-5 text-primary" />,
  };

  const gamemodeIcon = player ? gamemodeIcons[player.gamemode as string] || <Trophy className="h-5 w-5 text-primary" /> : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leaderboard
            </Link>
          </Button>

          {isLoading ? (
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <Skeleton className="h-48 w-48 rounded-xl" />
              <div className="space-y-4 w-full">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </div>
          ) : player ? (
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Player 3D Body Render */}
              <div className="bg-card/50 border border-border/50 rounded-xl p-6 flex items-center justify-center min-w-[200px] shadow-lg backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <PlayerAvatar username={player.name} type="body" size="xl" className="h-48 w-32 !rounded-none !border-0 !bg-transparent filter drop-shadow-xl" />
              </div>

              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight glow-text uppercase">
                      {player.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                      <TierBadge tier={player.tier} size="lg" />
                      <Badge variant="outline" className="font-mono text-sm bg-muted/50 border-muted-foreground/20">
                        {player.rank}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right bg-card/40 border border-border/50 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Points</div>
                    <div className="text-3xl font-mono font-bold text-primary">{player.points.toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  <Card className="bg-card/30 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Main Gamemode</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-md border border-primary/20">
                          {gamemodeIcon}
                        </div>
                        <span className="text-xl font-bold">{player.gamemode}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/30 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Region</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="bg-muted p-2 rounded-md border border-border">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-xl font-bold uppercase">{player.region}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/30 border-border/50 sm:col-span-2">
                    <CardContent className="p-4 flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Registered {format(new Date(player.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      <div className="text-xs">
                        Last updated {format(new Date(player.updatedAt), "MMM d, yyyy")}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
