import { useLocation } from "wouter";
import { Home, Users, BarChart3, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: Users, label: "Pods", path: "/pods" },
    { icon: BarChart3, label: "Insights", path: "/insights" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-4 py-2">
      <div className="flex justify-around items-center">
        {navItems.map(({ icon: Icon, label, path }) => (
          <Button
            key={path}
            variant="ghost"
            onClick={() => setLocation(path)}
            className={`flex flex-col items-center py-2 px-3 min-w-0 transition-colors ${
              location === path
                ? "text-coral"
                : "text-medium-gray hover:text-coral"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
