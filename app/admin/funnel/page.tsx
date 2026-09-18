import { Suspense } from "react";
import { FunnelClient } from "@/components/admin/funnel-client";
import { LoadingGrid } from "@/components/admin/ui";

export default function AdminFunnelPage() {
  return (
    <Suspense fallback={<LoadingGrid rows={2} />}>
      <FunnelClient />
    </Suspense>
  );
}
