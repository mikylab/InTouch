import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, MessageCircle, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface ResponseFeedProps {
  podId: number;
  promptId?: number;
}

export default function ResponseFeed({ podId, promptId }: ResponseFeedProps) {
  const { toast } = useToast();

  const { data: responses, isLoading } = useQuery({
    queryKey: ["/api/pods", podId, "responses", { promptId }],
    enabled: !!podId,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ responseId, isLiked }: { responseId: number; isLiked: boolean }) => {
      const method = isLiked ? "DELETE" : "POST";
      const response = await apiRequest(method, `/api/responses/${responseId}/like`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pods", podId, "responses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update like",
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

  const parseResponseContent = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return { text: content };
    }
  };

  const handleLike = (responseId: number, isLiked: boolean) => {
    likeMutation.mutate({ responseId, isLiked });
  };

  if (isLoading) {
    return (
      <div className="px-4 pb-20">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-20">
      <h3 className="text-lg font-semibold mb-4 text-dark-gray">Recent Responses</h3>
      
      <div className="space-y-4">
        {!responses || !Array.isArray(responses) ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-medium-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-gray mb-2">No responses yet</h3>
            <p className="text-medium-gray">Be the first to share your thoughts!</p>
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-medium-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-gray mb-2">No responses yet</h3>
            <p className="text-medium-gray">Be the first to share your thoughts!</p>
          </div>
        ) : (
          responses.map((response: any) => {
            const content = parseResponseContent(response.content);
            let timeAgo = "Recently";
            try {
              if (response.createdAt) {
                const createdDate = new Date(response.createdAt);
                if (!isNaN(createdDate.getTime())) {
                  timeAgo = formatDistanceToNow(createdDate, { addSuffix: true });
                }
              }
            } catch {
              timeAgo = "Recently";
            }
            
            return (
              <Card key={response.id} className="border border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-teal text-white">
                          {getInitials(response.user?.displayName || "User")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-dark-gray">{response.user?.displayName || "User"}</p>
                        <p className="text-xs text-medium-gray">{timeAgo}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(response.id, response.isLiked)}
                      className={response.isLiked ? "text-coral" : "text-medium-gray hover:text-coral"}
                    >
                      <Heart className={`w-4 h-4 ${response.isLiked ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {content.high && (
                      <div>
                        <p className="text-sm font-medium text-teal mb-1">💫 High:</p>
                        <p className="text-gray-700">{content.high}</p>
                      </div>
                    )}
                    {content.low && (
                      <div>
                        <p className="text-sm font-medium text-coral mb-1">😔 Low:</p>
                        <p className="text-gray-700">{content.low}</p>
                      </div>
                    )}
                    {content.text && !content.high && !content.low && (
                      <p className="text-gray-700">{content.text}</p>
                    )}
                  </div>

                  {response.imageUrl && (
                    <img 
                      src={response.imageUrl} 
                      alt="Response" 
                      className="w-full h-48 object-cover rounded-xl mt-3"
                    />
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(response.id, response.isLiked)}
                        className={`flex items-center space-x-1 transition-colors ${
                          response.isLiked 
                            ? "text-coral" 
                            : "text-medium-gray hover:text-coral"
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{response.likesCount || 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-1 text-medium-gray hover:text-teal transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{response.commentsCount || 0}</span>
                      </Button>
                    </div>
                    <span className="text-xs text-medium-gray">in {response.pod?.name || "Pod"}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
