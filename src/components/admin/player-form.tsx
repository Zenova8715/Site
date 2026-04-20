import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePlayer, useUpdatePlayer, useListGamemodes } from "@workspace/api-client-react";
import { Player, Tier, Gamemode } from "@workspace/api-client-react/src/generated/api.schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const playerSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  tier: z.nativeEnum(Tier, { required_error: "Tier is required" }),
  gamemode: z.nativeEnum(Gamemode, { required_error: "Gamemode is required" }),
  points: z.coerce.number().min(0, "Points must be positive").int(),
  region: z.string().min(1, "Region is required").max(10),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface PlayerFormProps {
  player?: Player;
  onSuccess: () => void;
}

export function PlayerForm({ player, onSuccess }: PlayerFormProps) {
  const { toast } = useToast();
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const { data: gamemodes } = useListGamemodes();

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player?.name || "",
      tier: player?.tier || Tier.S,
      gamemode: player?.gamemode || Gamemode.Overall,
      points: player?.points || 0,
      region: player?.region || "NA",
    },
  });

  const onSubmit = async (data: PlayerFormValues) => {
    try {
      if (player) {
        await updatePlayer.mutateAsync({ id: player.id, data });
        toast({ title: "Player updated", description: `${data.name} has been updated successfully.` });
      } else {
        await createPlayer.mutateAsync({ data });
        toast({ title: "Player created", description: `${data.name} has been added to the rankings.` });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard/summary"] });
      if (player) {
        queryClient.invalidateQueries({ queryKey: ["/api/players", player.id] });
      }
      
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Error saving player", 
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const isPending = createPlayer.isPending || updatePlayer.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minecraft Username</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Dream" {...field} className="bg-background/50 border-border" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tier</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background/50 border-border">
                      <SelectValue placeholder="Select Tier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Tier).map((tier) => (
                      <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gamemode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gamemode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background/50 border-border">
                      <SelectValue placeholder="Select Gamemode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {gamemodes?.map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    )) || Object.values(Gamemode).map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points (Elo)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1000" {...field} className="bg-background/50 border-border font-mono" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. NA, EU, AS" {...field} className="bg-background/50 border-border uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-border/50">
          <Button type="button" variant="ghost" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="glow-primary text-primary-foreground font-semibold">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {player ? "Save Changes" : "Add Player"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
