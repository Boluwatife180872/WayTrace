import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const SIMULATE_FUNCTION = "simulate";

async function invokeSimulation(action: string, deliveryId: string) {
  const { error } = await supabase.functions.invoke(SIMULATE_FUNCTION, {
    body: { action, delivery_id: deliveryId },
  });
  if (error) throw new Error(error.message);
}

export function useSimulator(deliveryId?: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!deliveryId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await invokeSimulation("run", deliveryId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setBusy(false);
    }
  }, [deliveryId, busy]);

  const reset = useCallback(async () => {
    if (!deliveryId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await invokeSimulation("reset", deliveryId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }, [deliveryId, busy]);

  return { run, reset, busy, error, clearError: () => setError(null) };
}