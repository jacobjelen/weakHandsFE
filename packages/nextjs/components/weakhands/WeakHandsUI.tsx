import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useBalance, useWaitForTransactionReceipt, useConnect } from 'wagmi';
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
    args: [address],
  });

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();

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

      if (!targetPrice || !targetDate) return;

      await writeContract({
        ...contractConfig,
        functionName: 'setParameters',
        args: [
          BigInt(new Date(targetDate).getTime() / 1000),
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

  const handleWithdraw = async () => {
    try {
      setTxStatus({ status: 'idle', action: 'withdraw' });
      if (!isConnected) {
        const connector = connectors[0];
        if (connector) {
          await connect({ connector });
          return;
        }
      }

      await writeContract({
        ...contractConfig,
        functionName: 'withdraw',
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
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <Button 
              className="w-full"
              onClick={handleSetParameters}
              disabled={(!targetPrice || !targetDate) && isConnected || isPending || isTxLoading}
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
                  {new Date(Number(lockInfo[1]) * 1000).toLocaleDateString()}
                  <span className="text-sm ml-2">
                    ({calculateDaysRemaining()} days remaining)
                  </span>
                </div>
              </div>
            </div>
            <Button 
              className="w-full"
              onClick={handleWithdraw}
              disabled={!canWithdrawData || isPending || isTxLoading}
            >
              {!isConnected ? 'Connect Wallet' : 
               isPending || isTxLoading ? 'Confirming...' : 'Withdraw'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}