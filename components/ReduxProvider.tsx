"use client";

import { useMemo } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/lib/store";

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create the store instance once using useMemo
  // This ensures the store is created only on the first render
  const store = useMemo(() => makeStore(), []);

  return <Provider store={store}>{children}</Provider>;
}
