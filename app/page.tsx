"use client";

import { redirect } from "next/navigation";

/** AT22 — real pages exist now; "/" just forwards to the dashboard. */
export default function Home() {
  return redirect("/dashboard");
}
