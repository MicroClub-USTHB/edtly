"use client";

import dynamic from "next/dynamic";

export const LazyToaster = dynamic(
  () => import("./toaster").then((module) => module.Toaster),
  { ssr: false },
);
