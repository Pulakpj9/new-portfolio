import { Suspense } from "react";
import { ChannelsClient } from "@/components/admin/channels-client";
import { LoadingGrid } from "@/components/admin/ui";

export default function AdminChannelsPage() {
  return (
    <Suspense fallback={<LoadingGrid rows={2} />}>
      <ChannelsClient />
    </Suspense>
  );
}
