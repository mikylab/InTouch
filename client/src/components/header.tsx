import { Bell, Heart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-coral rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-dark-gray">InTouch</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5 text-medium-gray" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-coral rounded-full"></span>
          </Button>
          
          {user && (
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-teal text-white text-sm">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
}
