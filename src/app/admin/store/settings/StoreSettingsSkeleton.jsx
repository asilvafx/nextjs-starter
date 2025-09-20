'use client';

import {
  Card,
  CardContent, 
  CardHeader, 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StoreSettingsSkeleton() {
  return (
    <div className="container space-y-4 pb-16">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="space-y-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-[250px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[100px]" />
      </div>
    </div>
  );
}