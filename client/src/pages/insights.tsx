import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Heart } from "lucide-react";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Insights() {
  const { data: pods } = useQuery({
    queryKey: ["/api/pods"],
  });

  const { data: currentPrompt } = useQuery({
    queryKey: ["/api/prompts/current"],
  });

  // Calculate some basic insights
  const totalPods = pods?.length || 0;
  const totalMembers = pods?.reduce((sum, pod) => sum + pod.memberCount, 0) || 0;
  const avgMembersPerPod = totalPods > 0 ? Math.round(totalMembers / totalPods) : 0;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <Header />
      
      <div className="p-4 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-dark-gray mb-2">Insights</h2>
          <p className="text-medium-gray">See how your friend groups are connecting</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-coral rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-dark-gray">{totalPods}</p>
                  <p className="text-xs text-medium-gray">Active Pods</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-teal rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-dark-gray">{totalMembers}</p>
                  <p className="text-xs text-medium-gray">Total Friends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Activity */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-coral" />
              <span>This Week's Activity</span>
            </CardTitle>
            <CardDescription>
              {currentPrompt?.title || "No active prompt this week"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentPrompt ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-medium-gray">Response Rate</span>
                  <Badge variant="outline" className="text-coral border-coral">
                    Coming Soon
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-medium-gray">Avg Members per Pod</span>
                  <span className="font-medium">{avgMembersPerPod}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-medium-gray">No active prompt to track this week.</p>
            )}
          </CardContent>
        </Card>

        {/* Pod Performance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-teal" />
              <span>Pod Activity</span>
            </CardTitle>
            <CardDescription>
              How engaged are your friend groups?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pods?.map((pod) => (
                <div key={pod.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{pod.name}</p>
                    <p className="text-xs text-medium-gray">{pod.memberCount} members</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      pod.memberCount >= 8 ? "text-coral border-coral" :
                      pod.memberCount >= 5 ? "text-teal border-teal" :
                      "text-yellow border-yellow"
                    }`}
                  >
                    {pod.memberCount >= 8 ? "Very Active" :
                     pod.memberCount >= 5 ? "Active" :
                     "Growing"}
                  </Badge>
                </div>
              ))}
              
              {(!pods || pods.length === 0) && (
                <p className="text-sm text-medium-gray text-center py-4">
                  Join or create pods to see activity insights.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coming Soon</CardTitle>
            <CardDescription>
              Features we're working on for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-coral rounded-full"></div>
                <span className="text-sm">Word clouds from responses</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-teal rounded-full"></div>
                <span className="text-sm">Weekly engagement scores</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow rounded-full"></div>
                <span className="text-sm">Favorite response voting</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-coral rounded-full"></div>
                <span className="text-sm">Monthly friendship stats</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
