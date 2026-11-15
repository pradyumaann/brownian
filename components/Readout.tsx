"use client";
import { useEffect } from "react";
import Brownian from "@/design/brownian-charts";

/** Installs the shared readout once: every [data-tip-v] mark gets it on hover, tap and focus. */
export function Readout() {
  useEffect(() => { Brownian.readout(); }, []);
  return null;
}
