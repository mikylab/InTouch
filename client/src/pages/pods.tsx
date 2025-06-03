import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Users, Plus, Settings, Crown } from "lucide-react";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPodSchema } from "@shared/schema";
import type { z } from "zod";

type CreatePodFormData = z.infer<typeof insertPodSchema>;

export default function Pods() {
  const [selectedPodId, setSelectedPodId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const { data: pods } = useQuery({
    queryKey: ["/api/pods"],
  });

  const { data: selectedPodMembers } = useQuery({
    queryKey: ["/api/pods", selectedPodId, "members"],
    enabled: !!selectedPodId,
  });

  const form = useForm<CreatePodFormData>({
    resolver: zodResolver(insertPodSchema.omit({ createdBy: true })),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createPodMutation = useMutation({
    mutationFn: async (data: Omit<CreatePodFormData, "createdBy">) => {
      const response = await apiRequest("POST", "/api/pods", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pods"] });
      setShowCreateModal(false);
      form.reset();
      toast({
        title: "Pod created!",
        description: "Your new pod has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create pod",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<CreatePodFormData, "createdBy">) => {
    createPodMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <Header />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-dark-gray">My Pods</h2>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="bg-coral hover:bg-coral-dark text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Pod
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Pod</DialogTitle>
                <DialogDescription>
                  Create a private group to connect with your close friends.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pod Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., College Friends" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your friend group..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-coral hover:bg-coral-dark text-white"
                      disabled={createPodMutation.isPending}
                    >
                      {createPodMutation.isPending ? "Creating..." : "Create Pod"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {pods?.map((pod) => (
            <Card 
              key={pod.id} 
              className={`cursor-pointer transition-colors ${
                selectedPodId === pod.id 
                  ? "border-coral bg-coral/5" 
                  : "hover:border-coral/50"
              }`}
              onClick={() => setSelectedPodId(selectedPodId === pod.id ? null : pod.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pod.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <span>{pod.memberCount} members</span>
                        {pod.isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              {selectedPodId === pod.id && selectedPodMembers && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm text-dark-gray mb-3">Members</h4>
                    <div className="space-y-2">
                      {selectedPodMembers.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-teal text-white text-xs">
                              {getInitials(member.user.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{member.user.displayName}</p>
                            <p className="text-xs text-medium-gray">@{member.user.username}</p>
                          </div>
                          {member.isAdmin && (
                            <Badge variant="outline" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {(!pods || pods.length === 0) && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-medium-gray mx-auto mb-4" />
              <h3 className="text-lg font-medium text-dark-gray mb-2">No pods yet</h3>
              <p className="text-medium-gray mb-4">Create your first pod to start connecting with friends.</p>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-coral hover:bg-coral-dark text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Pod
              </Button>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
