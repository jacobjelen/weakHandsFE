import { useEffect, useState } from 'react';
import { Card, CardContent } from '~~/components/ui/card';
import { formatEther } from 'viem';
import { usePublicClient } from 'wagmi';
import { type Address, type Abi } from 'viem';

// Define types for props and state
interface ContractConfig {
  address: Address;
  abi: Abi;
}

interface ContractStatsProps {
  contractConfig: ContractConfig;
}

interface StatsData {
  totalLocked: bigint;
  activeWallets: number;
}

interface DepositEvent {
  args: {
    user: Address;
    amount: bigint;
    newTotal: bigint;
  };
}

type LockInfo = [
  amount: bigint,
  targetDate: bigint,
  targetPrice: bigint,
  parametersSet: boolean,
  withdrawn: boolean
];

const ContractStats = ({ contractConfig }: ContractStatsProps) => {
  const [statsData, setStatsData] = useState<StatsData>({
    totalLocked: 0n,
    activeWallets: 0
  });
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchStats = async () => {
      if (!publicClient) {
        console.warn("Public client not available");
        return;
      }
      
      try {
        // Get deposit events
        const depositEvents = await publicClient.getLogs({
          address: contractConfig.address,
          event: {
            type: 'event',
            name: 'Deposit',
            inputs: [
              { type: 'address', name: 'user', indexed: true },
              { type: 'uint256', name: 'amount' },
              { type: 'uint256', name: 'newTotal' }
            ]
          },
          fromBlock: 0n,
          toBlock: 'latest'
        }) as unknown as DepositEvent[];

        // Get unique addresses
        const uniqueAddresses = [...new Set(depositEvents.map(event => event.args.user))];

        // Get lock info for each address and calculate totals
        let totalLocked = 0n;
        let activeWallets = 0;

        for (const address of uniqueAddresses) {
          const lockInfo = await publicClient.readContract({
            ...contractConfig,
            functionName: 'getLockInfo',
            args: [address],
          }) as LockInfo;

          if (lockInfo && lockInfo[0] > 0n && !lockInfo[4]) {
            totalLocked += lockInfo[0];
            activeWallets++;
          }
        }

        setStatsData({
          totalLocked,
          activeWallets
        });

      } catch (error) {
        console.error('Error fetching stats:', error instanceof Error ? error.message : 'Unknown error');
      }
    };

    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [publicClient, contractConfig]);

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-1">Active Locks</div>
            <div className="text-3xl font-bold text-indigo-600">
              {statsData.activeWallets}
            </div>
          </div>
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-1">Total ETH Locked</div>
            <div className="text-3xl font-bold text-indigo-600">
              {formatEther(statsData.totalLocked).slice(0, 8)} ETH
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractStats;