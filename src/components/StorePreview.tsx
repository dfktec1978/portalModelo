"use client";

import React from "react";
import StoreCard from "@/components/StoreCard";

export default function StorePreview({ store, internalHref }: { store: any, internalHref?: string }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <StoreCard store={{ id: 'preview', store_name: store.store_name || '', name: store.store_name || '', description: store.description || '', logo: store.logo || '', external_url: store.external_url || null }} internalHref={internalHref} />
    </div>
  );
}
