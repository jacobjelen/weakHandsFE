import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useBalance, useWaitForTransactionReceipt, useConnect } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '~~/components/ui/card';
import { Button } from '~~/components/ui/button';
import { Input } from '~~/components/ui/input';
import { parseEther, formatEther } from 'viem';

const contractConfig = {
  address: '0xa2acaf9aae7ae087049b65ff5215a43cea132f3b',
  abi: [
    {
      type: 'function',
      name: 'deposit',
      stateMutability: 'payable',
      inputs: [],
      outputs: [],
    },
    {
      type: 'function',
      name: 'setParameters',
      stateMutability: 'nonpayable',
      inputs: [
        { type: 'uint256', name: '_targetDate' },
        { type: 'uint256', name: '_targetPriceUSD' }
      ],
      outputs: [],
    },
    {
      type: 'function',
      name: 'getLockInfo',
      stateMutability: 'view',
      inputs: [{ type: 'address', name: '_user' }],
      outputs: [
        { type: 'uint256', name: 'amount' },
        { type: 'uint256', name: 'targetDate' },
        { type: 'uint256', name: 'targetPrice' },
        { type: 'bool', name: 'parametersSet' },
        { type: 'bool', name: 'withdrawn' }
      ],
    },
    {
      type: 'function',
      name: 'getLatestPrice',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'uint256' }],
    },
    {
      type: 'function',
      name: 'canWithdraw',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'bool' }],
    },
    {
      type: 'function',
      name: 'withdraw',
      stateMutability: 'nonpayable',
      inputs: [],
      outputs: [],
    }
  ]
} as const;

export default function WeakHandsInterface() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [depositAmount, setDepositAmount] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [error, setError] = useState('');
  
  // Get user's ETH balance
  const { data: balance } = useBalance({
    address: address,
  });

  // Contract read hooks
  const { data: latestPrice } = useReadContract({
    ...contractConfig,
    functionName: 'getLatestPrice',
    watch: true,
  });

  const { data: lockInfo } = useReadContract({
    ...contractConfig,
    functionName: 'getLockInfo',
    args: address ? [address] : undefined,
    watch: true,
  });

  const { data: canWithdrawData } = useReadContract({
    ...contractConfig,
    functionName: 'canWithdraw',
    args: address ? [] : undefined,
    watch: true,
  });

  // Contract write hooks
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();

  // Transaction receipt
  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({ 
    hash: txHash 
  });

  useEffect(() => {
    if (writeError) {
      setError(writeError.message);
    }
  }, [writeError]);

  // Handle deposits
  const handleDeposit = async () => {
    try {
      setError('');
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
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle setting parameters
  const handleSetParameters = async () => {
    try {
      setError('');
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
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle withdrawals
  const handleWithdraw = async () => {
    try {
      setError('');
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
    } catch (err) {
      setError(err.message);
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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Connected Address */}
      <div className="text-lg font-medium">
        {isConnected ? `Connected: ${address}` : 'Not Connected'}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Main Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* Deposit Box */}
        <Card>
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

        {/* Lock Parameters Box */}
        <Card>
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

      {/* Lock Information */}
      {lockInfo && !lockInfo[4] && (
        <Card>
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
};