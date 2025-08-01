'use client'

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const Web3Provider = dynamic(
  () => import("./Web3Provider").then(mod => ({ default: mod.Web3Provider })),
  { 
    ssr: false,
    loading: () => null 
  }
);

interface ClientWeb3ProviderProps {
  children: ReactNode;
}

export function ClientWeb3Provider({ children }: ClientWeb3ProviderProps) {
  return <Web3Provider>{children}</Web3Provider>;
}