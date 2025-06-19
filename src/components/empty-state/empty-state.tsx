// components/empty-state.tsx
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg w-full">
      <Rocket className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-1 text-primary-foreground">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );
}