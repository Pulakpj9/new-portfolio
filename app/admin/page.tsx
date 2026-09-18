import { Suspense } from "react";
import { OverviewClient } from "@/components/admin/overview-client";
import { LoadingGrid } from "@/components/admin/ui";

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <OverviewClient />
    </Suspense>
  );
}
