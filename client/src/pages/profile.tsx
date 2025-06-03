import { useMutation } from "@tanstack/react-query";
import { User, LogOut, Settings, Bell, HelpCircle } from "lucide-react";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You've been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <Header />
      
      <div className="p-4 pb-20">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-coral text-white text-xl">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-dark-gray">{user.displayName}</h2>
                <p className="text-medium-gray">@{user.username}</p>
                <p className="text-sm text-medium-gray">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Your InTouch Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-coral">{user.pods?.length || 0}</p>
                <p className="text-sm text-medium-gray">Pods Joined</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal">
                  {user.pods?.reduce((sum, pod) => sum + pod.memberCount, 0) || 0}
                </p>
                <p className="text-sm text-medium-gray">Total Friends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Menu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
            <CardDescription>Manage your account and preferences</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start px-6 py-4 h-auto"
                disabled
              >
                <Settings className="w-5 h-5 mr-3 text-medium-gray" />
                <div className="text-left">
                  <p className="font-medium">Account Settings</p>
                  <p className="text-sm text-medium-gray">Manage your profile and privacy</p>
                </div>
              </Button>
              
              <Separator />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start px-6 py-4 h-auto"
                disabled
              >
                <Bell className="w-5 h-5 mr-3 text-medium-gray" />
                <div className="text-left">
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-medium-gray">Configure your notification preferences</p>
                </div>
              </Button>
              
              <Separator />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start px-6 py-4 h-auto"
                disabled
              >
                <HelpCircle className="w-5 h-5 mr-3 text-medium-gray" />
                <div className="text-left">
                  <p className="font-medium">Help & Support</p>
                  <p className="text-sm text-medium-gray">Get help and contact support</p>
                </div>
              </Button>
              
              <Separator />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start px-6 py-4 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">
                    {logoutMutation.isPending ? "Logging out..." : "Sign Out"}
                  </p>
                  <p className="text-sm opacity-75">Sign out of your account</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
