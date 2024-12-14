import React, { useEffect, useState } from "react";
import { formatEther, getContract, parseEther } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/card";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";
import deployedContracts from "~~/contracts/deployedContracts";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const WeakHandsUI = () => {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isDepositing, setIsDepositing] = useState(false);
  const [isSettingPrice, setIsSettingPrice] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [parametersSet, setParametersSet] = useState(false);
  const [txResult, setTxResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const targetNetwork = getTargetNetworks()[0];
  const weakHandsContract = deployedContracts[targetNetwork.id]?.WeakHands;

  const contract = weakHandsContract
    ? getContract({
        address: weakHandsContract.address,
        abi: weakHandsContract.abi,
        publicClient,
        walletClient: walletClient ?? undefined,
      })
    : null;

  const handleDeposit = async () => {
    if (!contract || !walletClient || !depositAmount) return;

    setIsDepositing(true);
    setTxResult(null);

    try {
      const deposit = await walletClient.writeContract({
        address: weakHandsContract.address,
        abi: weakHandsContract.abi,
        functionName: "deposit",
        value: parseEther(depositAmount),
      });

      await publicClient.waitForTransactionReceipt({ hash: deposit });

      setTxResult({
        success: true,
        message: `Successfully deposited ${depositAmount} ETH!`,
      });
      setDepositAmount("");
    } catch (error) {
      setTxResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleSetTargetPrice = async () => {
    if (!contract || !walletClient || !targetPrice || !releaseDate || !address) return;

    try {
      // First check if there's a deposit and if parameters are already set
      const lockInfo = (await publicClient.readContract({
        address: weakHandsContract.address,
        abi: weakHandsContract.abi,
        functionName: "getLockInfo",
        args: [address],
      })) as [bigint, bigint, bigint, boolean, boolean];

      const [amount, , , parametersAlreadySet, withdrawn] = lockInfo;

      if (amount === 0n) {
        setTxResult({
          success: false,
          message: "Please make a deposit first before setting parameters",
        });
        return;
      }

      if (parametersAlreadySet) {
        setTxResult({
          success: false,
          message: "Parameters have already been set for this lock",
        });
        return;
      }

      if (withdrawn) {
        setTxResult({
          success: false,
          message: "This lock has been withdrawn. Please make a new deposit first.",
        });
        return;
      }

      // Convert release date string to Unix timestamp
      const releaseDateTimestamp = Math.floor(new Date(releaseDate).getTime() / 1000);
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (releaseDateTimestamp <= currentTimestamp) {
        setTxResult({
          success: false,
          message: "Release date must be in the future",
        });
        return;
      }

      setIsSettingPrice(true);
      setTxResult(null);

      const setPriceTx = await walletClient.writeContract({
        address: weakHandsContract.address,
        abi: weakHandsContract.abi,
        functionName: "setParameters",
        args: [BigInt(releaseDateTimestamp), Math.floor(parseFloat(targetPrice))],
      });

      await publicClient.waitForTransactionReceipt({ hash: setPriceTx });

      setTxResult({
        success: true,
        message: `Successfully set target price to $${targetPrice} and release date to ${new Date(releaseDateTimestamp * 1000).toLocaleDateString()}!`,
      });
      setParametersSet(true);
    } catch (error) {
      console.error("Error:", error);
      setTxResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSettingPrice(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setDepositAmount(value);
    }
  };

  const handleTargetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTargetPrice(value);
    }
  };

  const incrementAmount = () => {
    const currentAmount = parseFloat(depositAmount || "0");
    setDepositAmount((currentAmount + 0.01).toFixed(2));
  };

  const decrementAmount = () => {
    const currentAmount = parseFloat(depositAmount || "0");
    if (currentAmount >= 0.01) {
      setDepositAmount((currentAmount - 0.01).toFixed(2));
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const isValidAmount = depositAmount !== "" && parseFloat(depositAmount) > 0;
  const isValidTargetPrice = targetPrice !== "" && parseFloat(targetPrice) > 0;
  const isValidReleaseDate = releaseDate && new Date(releaseDate).getTime() > Date.now();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [canWithdrawNow, setCanWithdrawNow] = useState(false);

  // Add new state for lock status
  const [lockStatus, setLockStatus] = useState({
    amount: 0n,
    targetDate: 0n,
    targetPrice: 0n,
    parametersSet: false,
    withdrawn: false,
    loading: true,
  });

  // Add useEffect to fetch lock status
  useEffect(() => {
    const fetchLockStatus = async () => {
      if (!contract || !publicClient || !address) {
        setLockStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const lockInfo = (await publicClient.readContract({
          address: weakHandsContract.address,
          abi: weakHandsContract.abi,
          functionName: "getLockInfo",
          args: [address],
        })) as [bigint, bigint, bigint, boolean, boolean];

        const [amount, targetDate, targetPrice, parametersSet, withdrawn] = lockInfo;

        setLockStatus({
          amount,
          targetDate,
          targetPrice,
          parametersSet,
          withdrawn,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching lock status:", error);
        setLockStatus(prev => ({ ...prev, loading: false }));
      }
    };

    fetchLockStatus();
  }, [contract, publicClient, address, isConnected]);

  // Add useEffect to update status after transactions
  useEffect(() => {
    if (txResult?.success) {
      // Refresh lock status after successful transaction
      const fetchLockStatus = async () => {
        if (!contract || !publicClient || !address) return;

        try {
          const lockInfo = (await publicClient.readContract({
            address: weakHandsContract.address,
            abi: weakHandsContract.abi,
            functionName: "getLockInfo",
            args: [address],
          })) as [bigint, bigint, bigint, boolean, boolean];

          const [amount, targetDate, targetPrice, parametersSet, withdrawn] = lockInfo;

          setLockStatus({
            amount,
            targetDate,
            targetPrice,
            parametersSet,
            withdrawn,
            loading: false,
          });
        } catch (error) {
          console.error("Error updating lock status:", error);
        }
      };

      fetchLockStatus();
    }
  }, [txResult]);

  // Add useEffect to update the withdrewal status
  useEffect(() => {
    const checkWithdrawStatus = async () => {
      if (!contract || !publicClient || !address) {
        setCanWithdrawNow(false);
        return;
      }

      try {
        const canWithdraw = await publicClient.readContract({
          address: weakHandsContract.address,
          abi: weakHandsContract.abi,
          functionName: "canWithdraw",
        });

        setCanWithdrawNow(!!canWithdraw);
      } catch (error) {
        console.error("Error checking withdraw status:", error);
        setCanWithdrawNow(false);
      }
    };

    checkWithdrawStatus();
  }, [contract, publicClient, address, lockStatus]);

  const renderStatusSection = () => {
    if (!isConnected) return null;

    return (
      <div className="w-full max-w-md space-y-4 mb-6">
        <div className="space-y-1">
          <Label>Lock Status</Label>
          {lockStatus.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : lockStatus.amount === 0n ? (
            <p className="text-sm text-muted-foreground">
              No active deposit. Please add some ETH for me to look after!
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Deposited:</span>
                <span>{formatEther(lockStatus.amount)} ETH</span>

                {lockStatus.parametersSet && (
                  <>
                    <span className="text-muted-foreground">Target Price:</span>
                    <span>${Number(lockStatus.targetPrice) / 1e8} USD</span>

                    <span className="text-muted-foreground">Release Date:</span>
                    <span>{new Date(Number(lockStatus.targetDate) * 1000).toLocaleDateString()}</span>

                    <span className="text-muted-foreground">Status:</span>
                    <span className={lockStatus.withdrawn ? "text-yellow-500" : "text-green-500"}>
                      {lockStatus.withdrawn ? "Withdrawn" : "Locked"}
                    </span>
                  </>
                )}
              </div>

              {!lockStatus.parametersSet && !lockStatus.withdrawn && (
                <p className="text-sm text-yellow-500">Please set your target price and release date</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWithdrawSection = () => {
    if (!isConnected || lockStatus.amount === 0n || lockStatus.withdrawn) return null;

    return (
      <div className="w-full max-w-md space-y-4 mt-8">
        <div className="border-t pt-6">
          <Button
            onClick={handleWithdraw}
            disabled={isWithdrawing || !contract || !canWithdrawNow}
            className={`w-full h-16 text-lg font-bold ${
              canWithdrawNow ? "bg-green-500 hover:bg-green-600" : "bg-gray-500"
            }`}
          >
            {isWithdrawing ? "WITHDRAWING..." : "GIVE ME BACK MY CRYPTO!"}
          </Button>

          {!canWithdrawNow && lockStatus.parametersSet && (
            <p className="text-sm text-center mt-2 text-muted-foreground">
              Withdrawal unavailable until target date or price is reached
            </p>
          )}
        </div>
      </div>
    );
  };

  const handleWithdraw = async () => {
    if (!contract || !walletClient) return;

    setIsWithdrawing(true);
    setTxResult(null);

    try {
      const withdraw = await walletClient.writeContract({
        address: weakHandsContract.address,
        abi: weakHandsContract.abi,
        functionName: "withdraw",
      });

      await publicClient.waitForTransactionReceipt({ hash: withdraw });

      setTxResult({
        success: true,
        message: "Successfully withdrew your ETH!",
      });
    } catch (error) {
      let errorMessage = "An unknown error occurred";

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("Cannot withdraw yet")) {
          errorMessage = "You can't withdraw yet! Hold strong! 💪";
        } else if (error.message.includes("Transfer failed")) {
          errorMessage = "Transfer failed - please try again";
        } else {
          errorMessage = error.message;
        }
      }

      setTxResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Welcome to Weak Hands</CardTitle>
        <CardDescription className="text-center">
          Your friendly crypto holding partner, who won't let you down
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label>Wallet Status</Label>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm">{isConnected ? "Connected" : "Not Connected"}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Contract Status</Label>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${contract ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm">
                {contract ? "Loaded" : "Not Loaded"}
                {weakHandsContract && <span className="ml-2 font-mono text-sm">({weakHandsContract.address})</span>}
              </span>
            </div>
          </div>

          {!isConnected && (
            <div className="flex flex-col gap-2">
              <Label className="text-center">Please connect your wallet to continue</Label>
              <w3m-button />
            </div>
          )}

          {isConnected && (
            <>
              <div className="text-sm text-center text-muted-foreground">
                Connected Address: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>

              <div className="flex flex-col gap-4 items-center">{renderStatusSection()}</div>

              <div className="flex flex-col gap-4 items-center">
                <div className="w-full max-w-md space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount (ETH)</Label>
                  <div className="flex items-start gap-2">
                    <Input
                      id="depositAmount"
                      type="text"
                      placeholder="0.0"
                      value={depositAmount}
                      onChange={handleAmountChange}
                      disabled={isDepositing}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-0">
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0 flex items-center justify-center"
                        onClick={incrementAmount}
                        disabled={isDepositing}
                      >
                        <span className="text-xs">▲</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0 flex items-center justify-center"
                        onClick={decrementAmount}
                        disabled={isDepositing || !depositAmount || parseFloat(depositAmount) < 0.01}
                      >
                        <span className="text-xs">▼</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={isDepositing || !contract || !isValidAmount}
                  className="w-full max-w-md"
                >
                  {isDepositing ? "Depositing..." : "Deposit ETH"}
                </Button>

                {/* Target Price Section */}
                <div className="w-full max-w-md space-y-2 mt-6">
                  <div className="space-y-1">
                    <Label htmlFor="targetPrice">Target Price (USD)</Label>
                    <p className="text-sm text-muted-foreground">
                      Set your ETH target price in USD. This can only be set once and cannot be changed later.
                    </p>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="targetPrice"
                      type="text"
                      placeholder="Enter target price"
                      value={targetPrice}
                      onChange={handleTargetPriceChange}
                      disabled={isSettingPrice || parametersSet}
                      className="pl-6"
                    />
                  </div>
                </div>

                {/* Release Date Section */}
                <div className="w-full max-w-md space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="releaseDate">Release Date</Label>
                    <p className="text-sm text-muted-foreground">
                      Set your release date. This can only be set once and cannot be changed later.
                    </p>
                  </div>
                  <Input
                    id="releaseDate"
                    type="date"
                    min={today}
                    value={releaseDate}
                    onChange={e => setReleaseDate(e.target.value)}
                    disabled={isSettingPrice || parametersSet}
                  />
                </div>

                <Button
                  onClick={handleSetTargetPrice}
                  disabled={isSettingPrice || !contract || !isValidTargetPrice || !isValidReleaseDate || parametersSet}
                  className="w-full max-w-md"
                >
                  {isSettingPrice ? "Setting Parameters..." : parametersSet ? "Parameters Set!" : "Set Parameters"}
                </Button>

                {parametersSet && (
                  <p className="text-sm text-green-500">Parameters have been set and cannot be changed.</p>
                )}

                {txResult && (
                  <div className={`text-sm ${txResult.success ? "text-green-500" : "text-red-500"}`}>
                    {txResult.message}
                  </div>
                )}

                {renderWithdrawSection()}

                {txResult && (
                  <div className={`text-sm ${txResult.success ? "text-green-500" : "text-red-500"}`}>
                    {txResult.message}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeakHandsUI;
