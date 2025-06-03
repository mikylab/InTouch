import { useQuery } from "@tanstack/react-query";
import { Users, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Prompt } from "@shared/schema";

interface WeeklyPromptProps {
  prompt: Prompt;
  podId: number;
  onRespond: () => void;
}

export default function WeeklyPrompt({ prompt, podId, onRespond }: WeeklyPromptProps) {
  const { data: promptStats } = useQuery({
    queryKey: ["/api/prompts", prompt.id, "stats", podId],
  });

  const getDaysLeft = () => {
    try {
      const now = new Date();
      const weekEnd = new Date(prompt.weekEnd);
      
      if (isNaN(weekEnd.getTime())) {
        return "Active";
      }
      
      const diffTime = weekEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return "Expired";
      if (diffDays === 0) return "Last day";
      if (diffDays === 1) return "1 day left";
      return `${diffDays} days left`;
    } catch {
      return "Active";
    }
  };

  return (
    <div className="p-4">
      <div className="bg-gradient-to-r from-coral to-teal rounded-2xl p-6 text-white mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium opacity-90">This Week's Prompt</span>
          <div className="flex items-center space-x-1 text-sm opacity-75">
            <Calendar className="w-3 h-3" />
            <span>{getDaysLeft()}</span>
          </div>
        </div>
        
        <h2 className="text-xl font-bold mb-2">{prompt.title}</h2>
        {prompt.description && (
          <p className="text-sm opacity-90 mb-4">{prompt.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {promptStats && typeof promptStats === 'object' && 'responseCount' in promptStats && 'totalMembers' in promptStats
                ? `${promptStats.responseCount || 0} of ${promptStats.totalMembers || 0} responded`
                : "Loading..."
              }
            </span>
          </div>
          <Button
            onClick={onRespond}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Respond
          </Button>
        </div>
      </div>
    </div>
  );
}
