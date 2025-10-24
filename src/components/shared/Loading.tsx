import React from "react";

type Props = {
  entity?: string;
};

export default function Loading({ entity }: Props) {
  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading {entity}...</p>
        </div>
      </div>
    </div>
  );
}
