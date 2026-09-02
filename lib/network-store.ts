import { create } from "zustand";
import NetInfo from "@react-native-community/netinfo";

type NetworkState = {
  isConnected: boolean;
  lastUpdatedAt: number | null;
  setConnected: (v: boolean) => void;
  setLastUpdatedAt: (t: number) => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  lastUpdatedAt: null,
  setConnected: (v) => set({ isConnected: v }),
  setLastUpdatedAt: (t) => set({ lastUpdatedAt: t }),
}));

NetInfo.addEventListener((state) => {
  useNetworkStore.getState().setConnected(!!state.isConnected);
});