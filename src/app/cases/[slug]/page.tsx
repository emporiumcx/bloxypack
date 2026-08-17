"use client";

import Link from "next/link";
import { use } from "react";
import { CaseOpening } from "@/components/case-opening";
import { getCase } from "@/lib/catalog";

export default function CaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const item = getCase(slug);

  if (!item) {
    return (
      <div>
        <p>Case not found.</p>
        <Link href="/cases" className="text-green">
          Back to cases
        </Link>
      </div>
    );
  }

  return <CaseOpening item={item} />;
}
