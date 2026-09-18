import { Suspense } from "react";
import { SessionsClient } from "@/components/admin/sessions-client";
import { LoadingGrid } from "@/components/admin/ui";

export default function AdminSessionsPage() {
  return (
    <Suspense fallback={<LoadingGrid rows={2} />}>
      <SessionsClient />
    </Suspense>
  );
}
