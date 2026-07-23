"use client";

import * as React from "react";
import Image from "next/image";
import { cn, initials } from "@/lib/utils";

export function Avatar({
  src,
  name,
  size = 36,
  className,
}: {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-3 text-xs font-semibold text-secondary",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src && !errored ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          unoptimized
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
