"use client";

import { ErrorCardClient } from "@/components/error-client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorCardClient digest={error.digest} reset={reset} />;
}
