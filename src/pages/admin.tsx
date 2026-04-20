import { useState } from "react";
import { useListPlayers, useDeletePlayer } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlayerForm } from "@/components/admin/player-form";
import { TierBadge } from "@/components/ui/tier-badge";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Plus, Search, Edit, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Player } from "@workspace/api-client-react/src/generated/api.schemas";

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { toast } = useToast();

  const { data: players, isLoading, refetch, isRefetching } = useListPlayers({ search: search || undefined });
  const deletePlayer = useDeletePlayer();

  const handleDelete = async (id: number) => {
    try {
      await deletePlayer.mutateAsync({ id });
      toast({ title: "Player deleted", description: "The player has been removed from the rankings." });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard/summary"] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete player.", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage players, tiers, and leaderboard rankings.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="glow-primary gap-2">
                  <Plus className="h-4 w-4" /> Add Player
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-md">
                <DialogHeader>
                  <DialogTitle>Add New Player</DialogTitle>
                  <DialogDescription>Enter the details for the new ranked player.</DialogDescription>
                </DialogHeader>
                <PlayerForm onSuccess={() => setIsCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingPlayer} onOpenChange={(open) => !open && setEditingPlayer(null)}>
          <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>Update the details for {editingPlayer?.name}.</DialogDescription>
            </DialogHeader>
            {editingPlayer && (
              <PlayerForm player={editingPlayer} onSuccess={() => setEditingPlayer(null)} />
            )}
          </DialogContent>
        </Dialog>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/30 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search players to manage..." 
              className="pl-9 bg-background/50 border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {players?.length || 0} players total
          </div>
        </div>

        <div className="border border-border/50 rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : players?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No players found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  players?.map((player) => (
                    <TableRow key={player.id} className="border-border/30 hover:bg-muted/20">
                      <TableCell className="font-mono text-muted-foreground">{player.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <PlayerAvatar username={player.name} size="sm" />
                          <span className="font-bold">{player.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><TierBadge tier={player.tier} /></TableCell>
                      <TableCell className="text-muted-foreground">{player.gamemode}</TableCell>
                      <TableCell className="font-mono">{player.points}</TableCell>
                      <TableCell className="uppercase text-muted-foreground">{player.region}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingPlayer(player)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-destructive/20">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {player.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the player from the rankings.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(player.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete Player
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
