import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Home from "@/pages/home";
import Pods from "@/pages/pods";
import Insights from "@/pages/insights";
import Profile from "@/pages/profile";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-gray">
        <div className="text-center">
          <div className="w-8 h-8 bg-coral rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <p className="text-medium-gray">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pods" component={Pods} />
      <Route path="/insights" component={Insights} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
