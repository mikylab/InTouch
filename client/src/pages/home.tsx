import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import PodSelector from "@/components/pod-selector";
import WeeklyPrompt from "@/components/weekly-prompt";
import ResponseFeed from "@/components/response-feed";
import ResponseModal from "@/components/response-modal";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user } = useAuth();
  const [selectedPodId, setSelectedPodId] = useState<number | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  const { data: pods } = useQuery({
    queryKey: ["/api/pods"],
    enabled: !!user,
  });

  const { data: currentPrompt } = useQuery({
    queryKey: ["/api/prompts/current"],
    enabled: !!user,
  });

  // Auto-select first pod if none selected
  if (pods && pods.length > 0 && !selectedPodId) {
    setSelectedPodId(pods[0].id);
  }

  if (!selectedPodId) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <Header />
        <div className="p-4 text-center">
          <p className="text-medium-gray">No pods available. Create or join a pod to get started!</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Header />
      
      <PodSelector 
        pods={pods || []} 
        selectedPodId={selectedPodId}
        onPodSelect={setSelectedPodId}
      />
      
      {currentPrompt && (
        <WeeklyPrompt 
          prompt={currentPrompt}
          podId={selectedPodId}
          onRespond={() => setShowResponseModal(true)}
        />
      )}
      
      <ResponseFeed podId={selectedPodId} promptId={currentPrompt?.id} />
      
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4">
        <Button
          onClick={() => setShowResponseModal(true)}
          className="w-14 h-14 bg-coral hover:bg-coral-dark rounded-full shadow-lg p-0"
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
      </div>
      
      {showResponseModal && currentPrompt && (
        <ResponseModal
          prompt={currentPrompt}
          podId={selectedPodId}
          onClose={() => setShowResponseModal(false)}
        />
      )}
      
      <BottomNavigation />
    </div>
  );
}
