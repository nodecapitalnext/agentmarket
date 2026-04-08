"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState } from "react";
import { parseUnits, maxUint256 } from "viem";
import { PAYSTREAM_ADDRESS, PAYSTREAM_ABI, USDC_ADDRESS, ERC20_ABI } from "@/lib/wagmi";

const INTERVALS = [
  { label: "Daily", value: 86400 },
  { label: "Weekly", value: 604800 },
  { label: "Monthly", value: 2592000 },
];

export function SubscriptionPanel() {
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState(2592000);
  const [startNow, setStartNow] = useState(false);

  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: subIds } = useReadContract({
    address: PAYSTREAM_ADDRESS,
    abi: PAYSTREAM_ABI,
    functionName: "getSubscriberSubs",
    args: [address!],
    query: { enabled: !!address },
  });

  if (!isConnected) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
        Connect your wallet to manage subscriptions.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Create */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-medium">Create Subscription</h3>
        <p className="text-xs text-gray-500">On-chain recurring USDC payments via PayStream contract</p>

        <input
          type="text"
          placeholder="Recipient address (0x...)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        />
        <input
          type="number"
          placeholder="Amount (USDC)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        />
        <select
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        >
          {INTERVALS.map((i) => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={startNow} onChange={(e) => setStartNow(e.target.checked)} />
          Pay first installment now
        </label>

        <div className="flex gap-2">
          <button
            onClick={() => writeContract({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "approve", args: [PAYSTREAM_ADDRESS, maxUint256] })}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            1. Approve
          </button>
          <button
            onClick={() => writeContract({
              address: PAYSTREAM_ADDRESS,
              abi: PAYSTREAM_ABI,
              functionName: "createSubscription",
              args: [recipient as `0x${string}`, parseUnits(amount || "0", 6), BigInt(interval), startNow],
            })}
            disabled={isLoading || !recipient || !amount}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "2. Subscribe"}
          </button>
        </div>

        {isSuccess && (
          <div className="p-3 bg-green-900/30 border border-green-700 rounded-xl text-green-400 text-sm">
            ✓ Subscription created on Arc Testnet
          </div>
        )}
      </div>

      {/* List */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-medium mb-4">My Subscriptions</h3>
        {!subIds || subIds.length === 0 ? (
          <p className="text-sm text-gray-500">No active subscriptions.</p>
        ) : (
          <p className="text-sm text-gray-400">{subIds.length} subscription(s) found.</p>
        )}
      </div>
    </div>
  );
}
