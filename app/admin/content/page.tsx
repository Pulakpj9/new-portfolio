import { Suspense } from "react";
import { ContentClient } from "@/components/admin/content-client";
import { LoadingGrid } from "@/components/admin/ui";

export default function AdminContentPage() {
  return (
    <Suspense fallback={<LoadingGrid rows={2} />}>
      <ContentClient />
    </Suspense>
  );
}
