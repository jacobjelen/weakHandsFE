"use client";

import { useEffect, useState } from "react";
// Import contract ABIs 
import importLottery from "./Lottery.json";
import importLotteryToken from "./LotteryToken.json";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
// import { sepolia } from "viem/chains";
import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";

const contractAddress = "0x7a616Db51B8AA1a8cB366fe548873dbD51C783d0" as `0x${string}`;
const tokenAddress = "0x55ef317a867f1494609A3b4bfe5580976C2D39B5" as `0x${string}`;
const contractABI = importLottery.abi;
const tokenABI = importLotteryToken.abi;

// Wallet Balance Component
const WalletBalance = () => {
  const { address, isConnected } = useAccount();

  const { data: ethBalance } = useBalance({
    address,
    watch: true,
  });

  const { data: tokenBalance } = useBalance({
    address,
    token: tokenAddress,
    watch: true,
  });

  if (!isConnected) {
    return (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Wallet Balance</h2>
          <p>Please connect your wallet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Wallet Balance</h2>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">ETH Balance:</span>
            <span className="font-mono">{ethBalance ? formatEther(ethBalance.value) : "0"} ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Token Balance:</span>
            <span className="font-mono">{tokenBalance ? formatEther(tokenBalance.value) : "0"}</span>
          </div>
          <div className="text-xs text-base-content/70 truncate">Wallet: {address}</div>
        </div>
      </div>
    </div>
  );
};

// Token Purchase Component
const TokenPurchase = () => {
  const [ethAmount, setEthAmount] = useState("");
  const [expectedTokens, setExpectedTokens] = useState<bigint>(0n);

  const { data: purchaseRatio } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "purchaseRatio",
  });

  useEffect(() => {
    if (purchaseRatio && ethAmount) {
      try {
        const ethBigInt = parseEther(ethAmount);
        setExpectedTokens(ethBigInt * purchaseRatio);
      } catch (e) {
        console.error(e);
        setExpectedTokens(0n);
      }
    }
  }, [ethAmount, purchaseRatio]);

  const { writeContract, isLoading } = useWriteContract();

  const handlePurchase = () => {
    if (!ethAmount) return;

    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: "purchaseTokens",
      value: parseEther(ethAmount),
    });
  };

  return (
    <div className="flex flex-col gap-3 p-4 my-4 bg-base-100 rounded-3xl">
      <div className="flex items-center gap-4">
        <input
          type="number"
          placeholder="ETH Amount"
          value={ethAmount}
          onChange={e => setEthAmount(e.target.value)}
          className="input input-bordered w-full"
        />
        <button
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          onClick={handlePurchase}
          disabled={!ethAmount || isLoading}
        >
          {isLoading ? "Purchasing..." : "Purchase Tokens"}
        </button>
      </div>
      {expectedTokens > 0n && <div className="text-sm">Expected tokens: {formatEther(expectedTokens)}</div>}
    </div>
  );
};

// Return Tokens Component
const ReturnTokens = () => {
  const [tokenAmount, setTokenAmount] = useState("");
  const [expectedEth, setExpectedEth] = useState<bigint>(0n);
  const { address } = useAccount();

  const { data: purchaseRatio } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "purchaseRatio",
  });

  const { data: tokenBalance } = useBalance({
    address,
    token: tokenAddress,
  });

  useEffect(() => {
    if (purchaseRatio && tokenAmount) {
      try {
        const tokenBigInt = parseEther(tokenAmount);
        setExpectedEth(tokenBigInt / purchaseRatio);
      } catch (e) {
        console.error(e);
        setExpectedEth(0n);
      }
    }
  }, [tokenAmount, purchaseRatio]);

  const { writeContract: writeTokenApproval } = useWriteContract();
  const { writeContract: writeReturn, isLoading } = useWriteContract();

  const handleReturn = async () => {
    if (!tokenAmount) return;

    const tokenBigInt = parseEther(tokenAmount);
    writeTokenApproval({
      address: tokenAddress,
      abi: tokenABI,
      functionName: "approve",
      args: [contractAddress, tokenBigInt],
    });

    writeReturn({
      address: contractAddress,
      abi: contractABI,
      functionName: "returnTokens",
      args: [tokenBigInt],
    });
  };

  return (
    <div className="flex flex-col gap-3 p-4 my-4 bg-base-100 rounded-3xl">
      <div className="flex items-center gap-4">
        <input
          type="number"
          placeholder="Token Amount"
          value={tokenAmount}
          onChange={e => setTokenAmount(e.target.value)}
          max={tokenBalance ? formatEther(tokenBalance.value) : undefined}
          className="input input-bordered w-full"
        />
        <button
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          onClick={handleReturn}
          disabled={!tokenAmount || isLoading}
        >
          {isLoading ? "Returning..." : "Return Tokens"}
        </button>
      </div>
      {expectedEth > 0n && <div className="text-sm">Expected ETH: {formatEther(expectedEth)}</div>}
      {tokenBalance && <div className="text-sm">Token Balance: {formatEther(tokenBalance.value)}</div>}
    </div>
  );
};

// Place Bet Component
const PlaceBet = () => {
  const [numberOfBets, setNumberOfBets] = useState<string>("1");
  const [isApproving, setIsApproving] = useState(false);

  const { data: betPrice } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "betPrice",
  });

  const { data: betFee } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "betFee",
  });

  const calculateTotalCost = () => {
    if (!betPrice || !betFee || !numberOfBets) return BigInt(0);
    return (betPrice + betFee) * BigInt(parseInt(numberOfBets));
  };

  const { writeContract: writeTokenApproval, isLoading: isApprovalLoading } = useWriteContract();
  const { writeContract: writeBet, isLoading: isBetLoading } = useWriteContract();

  const handlePlaceBet = async () => {
    try {
      if (!numberOfBets || parseInt(numberOfBets) <= 0) return;

      const totalCost = calculateTotalCost();
      writeTokenApproval({
        address: tokenAddress,
        abi: tokenABI,
        functionName: "approve",
        args: [contractAddress, totalCost],
      });
      setIsApproving(true);
    } catch (err) {
      console.error("Error placing bet:", err);
      setIsApproving(false);
    }
  };

  const handleBetAfterApproval = () => {
    try {
      writeBet({
        address: contractAddress,
        abi: contractABI,
        functionName: "betMany",
        args: [BigInt(parseInt(numberOfBets))],
      });
      setIsApproving(false);
    } catch (err) {
      console.error("Error placing bet:", err);
      setIsApproving(false);
    }
  };

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Place Bet</h2>

        <div className="text-sm space-y-1">
          <div>Bet Price: {betPrice ? formatEther(betPrice) : "..."} tokens</div>
          <div>Bet Fee: {betFee ? formatEther(betFee) : "..."} tokens</div>
          <div>Total Cost per Bet: {betPrice && betFee ? formatEther(betPrice + betFee) : "..."} tokens</div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <input
            type="number"
            placeholder="Number of bets"
            value={numberOfBets}
            onChange={e => setNumberOfBets(e.target.value)}
            className="input input-bordered w-full"
            min="1"
          />

          <div className="text-sm">Total Cost: {formatEther(calculateTotalCost())} tokens</div>

          {!isApproving ? (
            <button
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              onClick={handlePlaceBet}
              disabled={isApprovalLoading || !numberOfBets || parseInt(numberOfBets) <= 0}
            >
              {isApprovalLoading ? "Approving..." : "Place Bet"}
            </button>
          ) : (
            <button
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              onClick={handleBetAfterApproval}
              disabled={isBetLoading}
            >
              {isBetLoading ? "Betting..." : "Confirm Bet"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Lottery Prize Component
const LotteryPrize = () => {
  const { address } = useAccount();
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  const { data: betsClosingTime } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "betsClosingTime",
  });

  const { data: prize } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "prize",
    args: [address as `0x${string}`],
    watch: true,
  });

  const { data: prizePool } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "prizePool",
    watch: true,
  });

  const { writeContract: writeLotteryClose, isLoading: isClosing } = useWriteContract();
  const { writeContract: writePrizeWithdraw, isLoading: isWithdrawing } = useWriteContract();

  const canCloseLottery = betsClosingTime ? BigInt(Math.floor(Date.now() / 1000)) >= betsClosingTime : false;

  const handleCloseLottery = async () => {
    try {
      writeLotteryClose({
        address: contractAddress,
        abi: contractABI,
        functionName: "closeLottery",
      });
    } catch (err) {
      console.error("Error closing lottery:", err);
    }
  };

  const handleWithdrawPrize = async () => {
    try {
      if (!withdrawAmount) return;

      writePrizeWithdraw({
        address: contractAddress,
        abi: contractABI,
        functionName: "prizeWithdraw",
        args: [BigInt(parseFloat(withdrawAmount) * 1e18)],
      });
    } catch (err) {
      console.error("Error withdrawing prize:", err);
    }
  };

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Lottery Prize</h2>

        <div className="text-sm space-y-2">
          <div>Total Prize Pool: {prizePool ? formatEther(prizePool) : "0"} tokens</div>
          <div>Your Prize: {prize ? formatEther(prize) : "0"} tokens</div>

          {betsClosingTime && <div>Closing Time: {new Date(Number(betsClosingTime) * 1000).toLocaleString()}</div>}
        </div>

        {canCloseLottery && (
          <button
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:bg-gray-400 mt-4"
            onClick={handleCloseLottery}
            disabled={isClosing}
          >
            {isClosing ? "Closing..." : "Close Lottery"}
          </button>
        )}

        {prize && prize > 0n && (
          <div className="flex flex-col gap-4 mt-4">
            <input
              type="number"
              placeholder="Amount to withdraw"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              className="input input-bordered w-full"
              min="0"
              max={formatEther(prize)}
            />

            <button
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              onClick={handleWithdrawPrize}
              disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
            >
              {isWithdrawing ? "Withdrawing..." : "Withdraw Prize"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Home: NextPage = () => {
  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 space-y-6">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-8">Lottery dApp</h1>

            {/* Balances Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Your Balances</h2>
              <WalletBalance />
            </div>

            {/* Token Management Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Token Management</h2>
              <TokenPurchase />
              <ReturnTokens />
            </div>

            {/* Betting Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Place Your Bets</h2>
              <PlaceBet />
            </div>

            {/* Prize Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Prize Management</h2>
              <LotteryPrize />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
