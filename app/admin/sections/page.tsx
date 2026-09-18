import { Suspense } from "react";
import { SectionsClient } from "@/components/admin/sections-client";
import { LoadingGrid } from "@/components/admin/ui";

export default function AdminSectionsPage() {
  return (
    <Suspense fallback={<LoadingGrid rows={2} />}>
      <SectionsClient />
    </Suspense>
  );
}
