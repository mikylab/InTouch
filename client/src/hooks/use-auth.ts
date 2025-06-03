import { useQuery } from "@tanstack/react-query";
import type { UserWithPods } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<UserWithPods | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }
        
        return response.json();
      } catch {
        return null;
      }
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
