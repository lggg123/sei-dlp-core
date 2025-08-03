'use client'

import dynamic from "next/dynamic";
import { ReactNode } from "react";
import { SeiGlobalWalletProvider } from "./SeiGlobalWalletProvider";

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
  return (
    <SeiGlobalWalletProvider>
      <Web3Provider>{children}</Web3Provider>
    </SeiGlobalWalletProvider>
  );
}