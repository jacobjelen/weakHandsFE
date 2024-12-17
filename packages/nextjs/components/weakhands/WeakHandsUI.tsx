import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useBalance, useWaitForTransactionReceipt, useConnect, usePublicClient } from 'wagmi';
import { type Abi } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '~~/components/ui/card';
import { Button } from '~~/components/ui/button';
import { Input } from '~~/components/ui/input';
import contractConfig from './ContractConfig';
import { parseEther, formatEther, type Address } from 'viem';
import { XCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

type TransactionStatus = {
  hash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
  action: string;
};

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

// Define the type for lock info return data
type LockInfo = [bigint, bigint, bigint, boolean, boolean];

interface WriteContractResult {
  hash: string;
}

export default function WeakHandsInterface() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [depositAmount, setDepositAmount] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    status: 'idle',
    action: ''
  });
  const [targetTime, setTargetTime] = useState('00:00');
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const { data: balance } = useBalance({
    address: address,
  });

  const { data: latestPrice } = useReadContract({
    ...contractConfig,
    functionName: 'getLatestPrice',
  });

  const { data: lockInfo } = useReadContract({
    ...contractConfig,
    functionName: 'getLockInfo',
    args: [address],
  }) as { data: LockInfo | undefined };

  const { data: canWithdrawData } = useReadContract({
    ...contractConfig,
    functionName: 'canWithdraw',
    account: address,
    query: {
      enabled: Boolean(address) && isConnected,
    },
    // watch: true,
  });

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (lockInfo && latestPrice) {
      console.log('Debug info:');
      console.log('Current time:', Math.floor(Date.now() / 1000));
      console.log('Target time:', Number(lockInfo[1]));
      console.log('Current price:', Number(latestPrice) / 1e8);
      console.log('Target price:', Number(lockInfo[2]) / 1e8);
      console.log('Can withdraw?:', canWithdrawData);
    }
  }, [lockInfo, latestPrice, canWithdrawData]);

  useEffect(() => {
    console.log('Debug extended:');
    console.log('Address:', address);
    console.log('Can withdraw data:', canWithdrawData);
    console.log('Is connected:', isConnected);
  }, [address, canWithdrawData, isConnected]);


  useEffect(() => {
    console.log('State Debug:');
    console.log('Address:', address);
    console.log('Is Connected:', isConnected);
    console.log('Can Withdraw Data:', canWithdrawData);
    console.log('Contract Config:', contractConfig);
    
    // Try reading the contract state directly
    if (address && isConnected && publicClient) {
      const checkWithdraw = async () => {
        try {
          const result = await publicClient.readContract({
            ...contractConfig,
            functionName: 'canWithdraw',
            account: address,
          });
          console.log('Direct contract read result:', result);
        } catch (err) {
          console.error('Contract read error:', err);
        }
      };
      checkWithdraw();
    }
  }, [address, isConnected, canWithdrawData, publicClient]);

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash
  });

  useEffect(() => {
    if (isPending || isTxLoading) {
      setTxStatus(prev => ({
        ...prev,
        status: 'pending',
        hash: txHash
      }));
    } else if (isTxSuccess) {
      setTxStatus(prev => ({
        ...prev,
        status: 'success',
        hash: txHash
      }));
    }
  }, [isPending, isTxLoading, isTxSuccess, txHash]);

  useEffect(() => {
    if (writeError) {
      setTxStatus(prev => ({
        ...prev,
        status: 'error',
        error: writeError.message
      }));
    }
  }, [writeError]);

  const handleDeposit = async () => {
    try {
      setTxStatus({ status: 'idle', action: 'deposit' });
      if (!isConnected) {
        const connector = connectors[0];
        if (connector) {
          await connect({ connector });
          return;
        }
      }

      if (!depositAmount) return;

      await writeContract({
        ...contractConfig,
        functionName: 'deposit',
        value: parseEther(depositAmount),
      });
    } catch (err: unknown) {
      setTxStatus({
        status: 'error',
        error: err instanceof Error ? err.message : 'An unknown error occurred',
        action: 'deposit'
      });
    }
  };

  const handleSetParameters = async () => {
    try {
      setTxStatus({ status: 'idle', action: 'lock' });
      if (!isConnected) {
        const connector = connectors[0];
        if (connector) {
          await connect({ connector });
          return;
        }
      }

      if (!targetPrice || !targetDate || !targetTime) return;

      // Combine date and time
      const [hours, minutes] = targetTime.split(':').map(Number);
      const targetDateTime = new Date(targetDate);
      targetDateTime.setHours(hours, minutes, 0, 0);

      await writeContract({
        ...contractConfig,
        functionName: 'setParameters',
        args: [
          BigInt(Math.floor(targetDateTime.getTime() / 1000)),
          BigInt(Math.floor(parseFloat(targetPrice) * 1e8)),
        ],
      });
    } catch (err: unknown) {
      setTxStatus({
        status: 'error',
        error: err instanceof Error ? err.message : 'An unknown error occurred',
        action: 'lock'
      });
    }
  };

  const calculateTimeRemaining = (targetTimestamp: number): TimeRemaining => {
    const now = Date.now();
    const diff = Math.max(0, targetTimestamp - now);

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  };

  // Update countdown every second
  useEffect(() => {
    if (!lockInfo || lockInfo[4]) return;

    const targetTimestamp = Number(lockInfo[1]) * 1000;

    const updateCountdown = () => {
      setTimeRemaining(calculateTimeRemaining(targetTimestamp));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lockInfo]);

  const handleWithdraw = async () => {
    try {
      setTxStatus({ status: 'idle', action: 'withdraw' });
      if (!isConnected || !address) {
        const connector = connectors[0];
        if (connector) {
          await connect({ connector });
          return;
        }
      }
  
      await writeContract({
        ...contractConfig,
        functionName: 'withdraw',
        account: address, // Explicitly set the account
      });
    } catch (err: unknown) {
      setTxStatus({
        status: 'error',
        error: err instanceof Error ? err.message : 'An unknown error occurred',
        action: 'withdraw'
      });
    }
  };

  useEffect(() => {
    if (latestPrice) {
      setCurrentPrice(Number(latestPrice) / 1e8);
    }
  }, [latestPrice]);

  const calculatePriceDifference = () => {
    if (!lockInfo || !currentPrice) return 0;
    const targetPriceUSD = Number(lockInfo[2]) / 1e8;
    return ((targetPriceUSD - currentPrice) / currentPrice) * 100;
  };

  const calculateDaysRemaining = () => {
    if (!lockInfo) return 0;
    const targetTimestamp = Number(lockInfo[1]) * 1000;
    const now = Date.now();
    return Math.max(0, Math.ceil((targetTimestamp - now) / (1000 * 60 * 60 * 24)));
  };

  const TransactionAlert = () => {
    if (txStatus.status === 'idle') return null;

    const baseStyle = "px-4 py-3 rounded relative flex items-center gap-2 mb-4";
    const getStyle = () => {
      switch (txStatus.status) {
        case 'pending':
          return `${baseStyle} bg-yellow-100 border border-yellow-400 text-yellow-700`;
        case 'success':
          return `${baseStyle} bg-green-100 border border-green-400 text-green-700`;
        case 'error':
          return `${baseStyle} bg-red-100 border border-red-400 text-red-700`;
        default:
          return baseStyle;
      }
    };

    return (
      <div className={getStyle()}>
        {txStatus.status === 'pending' && (
          <>
            <Loader2 className="animate-spin" />
            <span>Transaction pending...</span>
          </>
        )}
        {txStatus.status === 'success' && (
          <>
            <CheckCircle2 className="text-green-500" />
            <span>Transaction successful!</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${txStatus.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-2 underline"
            >
              View on Etherscan <ExternalLink size={16} />
            </a>
          </>
        )}
        {txStatus.status === 'error' && (
          <>
            <XCircle className="text-red-500" />
            <span>{txStatus.error}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">

      <div className="text-lg font-medium">
        {isConnected ? `Connected: ${address}` : 'Not Connected'}
      </div>

      <TransactionAlert />

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle>Deposit ETH</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>Available: {balance?.formatted ?? '0'} ETH</div>
            <Input
              type="number"
              placeholder="Amount in ETH"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleDeposit}
              disabled={(!depositAmount && isConnected) || isPending || isTxLoading}
            >
              {!isConnected ? 'Connect Wallet' :
                isPending || isTxLoading ? 'Confirming...' : 'Deposit'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle>Set Lock Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="number"
              placeholder="Target Price (USD)"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
              <Input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSetParameters}
              disabled={(!targetPrice || !targetDate || !targetTime) && isConnected || isPending || isTxLoading}
            >
              {!isConnected ? 'Connect Wallet' :
                isPending || isTxLoading ? 'Confirming...' : 'Lock'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {address && lockInfo && !lockInfo[4] && (
        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle>Your Lock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="font-medium">Amount Locked</div>
                <div>{formatEther(lockInfo[0])} ETH</div>
              </div>
              <div>
                <div className="font-medium">Target Price</div>
                <div>
                  ${Number(lockInfo[2]) / 1e8}
                  <span className="text-sm ml-2">
                    ({calculatePriceDifference().toFixed(2)}% from current)
                  </span>
                </div>
              </div>
              <div>
                <div className="font-medium">Target Date</div>
                <div>
                  {new Date(Number(lockInfo[1]) * 1000).toLocaleString()}
                </div>
                <div className="text-sm mt-2 grid grid-cols-4 gap-2">
                  <div className="bg-primary/10 rounded p-2 text-center">
                    <div className="font-bold">{timeRemaining.days}</div>
                    <div className="text-xs">days</div>
                  </div>
                  <div className="bg-primary/10 rounded p-2 text-center">
                    <div className="font-bold">{timeRemaining.hours}</div>
                    <div className="text-xs">hours</div>
                  </div>
                  <div className="bg-primary/10 rounded p-2 text-center">
                    <div className="font-bold">{timeRemaining.minutes}</div>
                    <div className="text-xs">mins</div>
                  </div>
                  <div className="bg-primary/10 rounded p-2 text-center">
                    <div className="font-bold">{timeRemaining.seconds}</div>
                    <div className="text-xs">secs</div>
                  </div>
                </div>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleWithdraw}
              disabled={canWithdrawData === false || isPending || isTxLoading}
            >
              {!isConnected ? 'Connect Wallet' :
                isPending || isTxLoading ? 'Confirming...' :
                  canWithdrawData === undefined ? 'Loading...' :
                    canWithdrawData ? 'Withdraw' : 'Cannot withdraw yet'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}