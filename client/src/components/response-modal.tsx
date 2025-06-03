import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X, Star, CloudRain, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertResponseSchema } from "@shared/schema";
import { z } from "zod";
import type { Prompt } from "@shared/schema";

interface ResponseModalProps {
  prompt: Prompt;
  podId: number;
  onClose: () => void;
}

const responseFormSchema = z.object({
  high: z.string().min(1, "Please share your high for the week"),
  low: z.string().min(1, "Please share your low for the week"),
});

type ResponseFormData = z.infer<typeof responseFormSchema>;

export default function ResponseModal({ prompt, podId, onClose }: ResponseModalProps) {
  const { toast } = useToast();

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      high: "",
      low: "",
    },
  });

  const createResponseMutation = useMutation({
    mutationFn: async (data: ResponseFormData) => {
      const content = JSON.stringify({
        high: data.high,
        low: data.low,
      });
      
      const response = await apiRequest("POST", "/api/responses", {
        promptId: prompt.id,
        podId,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pods", podId, "responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts", prompt.id, "stats", podId] });
      onClose();
      toast({
        title: "Response shared! 🎉",
        description: "Your response has been shared with your pod.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to share response",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResponseFormData) => {
    createResponseMutation.mutate(data);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-t-3xl w-full max-w-md transform transition-transform p-0 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Share Your Response</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5 text-medium-gray" />
            </Button>
          </div>
          <p className="text-sm text-medium-gray mt-1">{prompt.title}</p>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="high"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-medium text-dark-gray">
                      <Star className="w-4 h-4 text-yellow mr-2" />
                      What made you smile this week?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share something that brought you joy..."
                        className="resize-none focus:ring-2 focus:ring-coral focus:border-transparent"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="low"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-medium text-dark-gray">
                      <CloudRain className="w-4 h-4 text-teal mr-2" />
                      What challenged you?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share something that was difficult..."
                        className="resize-none focus:ring-2 focus:ring-coral focus:border-transparent"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <label className="block text-sm font-medium text-dark-gray mb-2">
                  <Camera className="w-4 h-4 text-medium-gray mr-2 inline" />
                  Add a photo (optional)
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-coral transition-colors cursor-pointer">
                  <Camera className="w-8 h-8 text-medium-gray mx-auto mb-2" />
                  <p className="text-sm text-medium-gray">Coming soon - photo uploads</p>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-coral hover:bg-coral-dark text-white"
                  disabled={createResponseMutation.isPending}
                >
                  {createResponseMutation.isPending ? "Sharing..." : "Share Response"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
