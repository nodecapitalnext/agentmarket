"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, maxUint256 } from "viem";
import { PAYSTREAM_ADDRESS, PAYSTREAM_ABI, USDC_ADDRESS, ERC20_ABI } from "@/lib/wagmi";

const INTERVALS = [
  { label: "Günlük", value: 86400 },
  { label: "Haftalık", value: 604800 },
  { label: "Aylık", value: 2592000 },
];

export function CreateSubscription() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState(2592000);
  const [startNow, setStartNow] = useState(false);
  const [step, setStep] = useState<"idle" | "approving" | "creating">("idle");

  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  async function handleApprove() {
    setStep("approving");
    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [PAYSTREAM_ADDRESS, maxUint256],
    });
  }

  async function handleCreate() {
    setStep("creating");
    writeContract({
      address: PAYSTREAM_ADDRESS,
      abi: PAYSTREAM_ABI,
      functionName: "createSubscription",
      args: [
        recipient as `0x${string}`,
        parseUnits(amount, 6),
        BigInt(interval),
        startNow,
      ],
    });
  }

  if (isSuccess) {
    return (
      <div className="p-4 bg-green-900/30 border border-green-700 rounded-xl text-green-400 text-sm">
        ✓ {step === "approving" ? "Onay verildi! Şimdi abonelik oluşturabilirsin." : "Abonelik oluşturuldu!"}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">Yeni Abonelik Oluştur</h2>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Alıcı adresi (0x...)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />

        <input
          type="number"
          placeholder="Miktar (USDC)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />

        <select
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          {INTERVALS.map((i) => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={startNow}
            onChange={(e) => setStartNow(e.target.checked)}
            className="rounded"
          />
          İlk ödemeyi hemen yap
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          1. USDC Onayla
        </button>
        <button
          onClick={handleCreate}
          disabled={isLoading || !recipient || !amount}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? "İşleniyor..." : "2. Abonelik Oluştur"}
        </button>
      </div>
    </div>
  );
}
