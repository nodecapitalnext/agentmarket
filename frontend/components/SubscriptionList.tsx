"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { PAYSTREAM_ADDRESS, PAYSTREAM_ABI } from "@/lib/wagmi";
import { formatUnits } from "viem";

function SubscriptionCard({ subId }: { subId: bigint }) {
  const { data: sub } = useReadContract({
    address: PAYSTREAM_ADDRESS,
    abi: PAYSTREAM_ABI,
    functionName: "subscriptions",
    args: [subId],
  });

  const { data: isDue } = useReadContract({
    address: PAYSTREAM_ADDRESS,
    abi: PAYSTREAM_ABI,
    functionName: "isDue",
    args: [subId],
  });

  const { writeContract } = useWriteContract();

  if (!sub) return null;
  const [subscriber, recipient, amount, interval, , nextPayment, active] = sub;

  if (!active) return null;

  const nextDate = new Date(Number(nextPayment) * 1000).toLocaleDateString("tr-TR");

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500">Alıcı</p>
          <p className="text-sm font-mono">{recipient.slice(0, 8)}...{recipient.slice(-6)}</p>
        </div>
        <span className="text-xs px-2 py-1 bg-green-900/40 text-green-400 rounded-full">Aktif</span>
      </div>

      <div className="flex gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">Miktar</p>
          <p className="font-medium">{formatUnits(amount, 6)} USDC</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Sonraki Ödeme</p>
          <p className="font-medium">{nextDate}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        {isDue && (
          <button
            onClick={() => writeContract({
              address: PAYSTREAM_ADDRESS,
              abi: PAYSTREAM_ABI,
              functionName: "executePayment",
              args: [subId],
            })}
            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Ödeme Yap
          </button>
        )}
        <button
          onClick={() => writeContract({
            address: PAYSTREAM_ADDRESS,
            abi: PAYSTREAM_ABI,
            functionName: "cancelSubscription",
            args: [subId],
          })}
          className="text-xs px-3 py-1 border border-gray-700 hover:border-red-500 hover:text-red-400 rounded-lg transition-colors"
        >
          İptal Et
        </button>
      </div>
    </div>
  );
}

export function SubscriptionList() {
  const { address } = useAccount();

  const { data: subIds } = useReadContract({
    address: PAYSTREAM_ADDRESS,
    abi: PAYSTREAM_ABI,
    functionName: "getSubscriberSubs",
    args: [address!],
    query: { enabled: !!address },
  });

  if (!address) return null;
  if (!subIds || subIds.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        Henüz aboneliğin yok.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Aboneliklerim</h2>
      {subIds.map((id) => (
        <SubscriptionCard key={id.toString()} subId={id} />
      ))}
    </div>
  );
}
