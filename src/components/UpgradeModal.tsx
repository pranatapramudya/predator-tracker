"use client";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

const MOONPAY_LINKS = {
  SCOUT: "69f2f1f23efa8db4c0c649df",
  PREDATOR: "69f2f303b1cea9fd7396688f",
  APEX: "69f2f3603efa8db4c0c6510d",
};

export default function UpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);

  // Narik User ID yang lagi aktif/login dari Clerk
  const { userId } = useAuth();

  const tiers = [
    { id: "SCOUT", name: "SCOUT", price: 29, wallets: 3 },
    {
      id: "PREDATOR",
      name: "PREDATOR",
      price: 99,
      wallets: 15,
      popular: true,
    },
    {
      id: "APEX",
      name: "APEX WHALE",
      price: 499,
      wallets: 100,
    },
  ];

  const handleCheckout = () => {
    if (!userId) {
      alert("Please sign in first to upgrade your tier.");
      return;
    }

    if (!selectedTier) return;

    // Ambil ID MoonPay sesuai tier yang di-klik
    const linkId = MOONPAY_LINKS[selectedTier.id as keyof typeof MOONPAY_LINKS];

    // Bikin URL lengkap dengan nempelin userId Clerk ke parameter clientReferenceId
    const checkoutUrl = `https://moonpay.hel.io/pay/${linkId}?clientReferenceId=${userId}`;

    // Buka halaman kasir MoonPay di tab baru
    window.open(checkoutUrl, "_blank");
  };

  return (
    <>
      {/* TOMBOL UPGRADE UTAMA */}
      <button
        onClick={() => setIsOpen(true)}
        className="ml-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500 text-emerald-400 rounded-lg text-xs font-bold uppercase hover:bg-emerald-500 hover:text-black transition-all"
      >
        ⚡ Upgrade Radar
      </button>

      {/* MODAL POP-UP */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-neutral-800 rounded-2xl w-full max-w-4xl p-6 relative shadow-2xl shadow-emerald-500/10">
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedTier(null);
              }}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                Unlock <span className="text-emerald-400">Premium Target</span>
              </h2>
              <p className="text-neutral-400 text-sm mt-2">
                Secure checkout via Crypto or Credit Card. Instant access.
              </p>
            </div>

            {!selectedTier ? (
              // TAHAP 1: PILIH TIER
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((t) => (
                  <div
                    key={t.id}
                    className={`p-5 rounded-xl border cursor-pointer transition-all hover:-translate-y-1 ${
                      t.popular
                        ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                        : "border-neutral-800 hover:border-neutral-600 bg-neutral-900/50"
                    }`}
                    onClick={() => setSelectedTier(t)}
                  >
                    {t.popular && (
                      <span className="bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block">
                        BEST VALUE
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-white uppercase">
                      {t.name}
                    </h3>
                    <div className="text-3xl font-black mt-2 text-white">
                      ${t.price}
                    </div>
                    <div className="mt-4 text-sm text-neutral-400">
                      Track up to{" "}
                      <span className="text-emerald-400 font-bold">
                        {t.wallets} Whales
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // TAHAP 2: KONFIRMASI CHECKOUT
              <div className="max-w-md mx-auto bg-neutral-900 rounded-xl p-6 border border-neutral-800 text-center">
                <button
                  onClick={() => setSelectedTier(null)}
                  className="text-xs text-neutral-500 mb-4 hover:text-white transition-colors"
                >
                  ← Back to tiers
                </button>
                <h3 className="text-xl font-bold text-white">
                  {selectedTier.name} TIER
                </h3>
                <div className="text-5xl font-black text-emerald-400 my-4 tracking-tighter">
                  ${selectedTier.price}
                </div>

                <p className="text-sm text-neutral-400 mb-6">
                  You will be redirected to our secure payment gateway to
                  complete the transaction.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    Proceed to Checkout 🔒
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
