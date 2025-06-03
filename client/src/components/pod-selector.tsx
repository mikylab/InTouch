import { Button } from "@/components/ui/button";

interface Pod {
  id: number;
  name: string;
  memberCount: number;
}

interface PodSelectorProps {
  pods: Pod[];
  selectedPodId: number | null;
  onPodSelect: (podId: number) => void;
}

export default function PodSelector({ pods, selectedPodId, onPodSelect }: PodSelectorProps) {
  return (
    <div className="px-4 py-3 bg-warm-gray border-b border-gray-100">
      <div className="flex space-x-3 overflow-x-auto">
        {pods.map((pod) => (
          <Button
            key={pod.id}
            onClick={() => onPodSelect(pod.id)}
            variant={selectedPodId === pod.id ? "default" : "outline"}
            className={`flex-shrink-0 text-sm font-medium ${
              selectedPodId === pod.id
                ? "bg-coral hover:bg-coral-dark text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-coral hover:text-coral"
            }`}
          >
            <span>{pod.name}</span>
            <span className="ml-1 opacity-75">{pod.memberCount}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
