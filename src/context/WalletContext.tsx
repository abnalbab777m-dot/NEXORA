import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

export interface WalletData {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalDeposits: number;
  totalWithdrawals: number;
  updatedAt: string;
}

interface WalletContextType {
  wallet: WalletData | null;
  loading: boolean;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  loading: true,
  refreshWallet: async () => {},
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await api.getWallet();
      if (data && data.wallet) {
        setWallet(data.wallet);
      }
    } catch (e) {
      console.error(e);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [user]);

  return (
    <WalletContext.Provider value={{ wallet, loading, refreshWallet: fetchWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
