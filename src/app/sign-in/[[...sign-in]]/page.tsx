import { SignIn } from "@clerk/nextjs";
import { Shield, Activity } from "lucide-react";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white flex flex-col lg:flex-row overflow-x-hidden">
      {/* 🔥 JURUS DOBRAK CSS (HACK CLERK) 🔥 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .cl-badge {
            background-color: rgba(16, 185, 129, 0.15) !important;
            color: #34d399 !important;
            border: 1px solid rgba(16, 185, 129, 0.4) !important;
            font-weight: 800 !important;
          }
          .cl-userPreviewSecondaryIdentifier {
            color: rgba(255, 255, 255, 0.8) !important;
          }
        `,
        }}
      />

      <div className="flex-1 p-8 lg:p-12 flex-col justify-center relative overflow-hidden hidden lg:flex border-r border-white/10">
        <div className="absolute inset-0 bg-emerald-500/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#080808] to-[#080808]"></div>
        <div className="relative z-10 max-w-lg mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
            Auth Node
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none mb-6">
            Predator <span className="text-emerald-400">Tracker</span>
          </h1>
          <p className="text-white/60 text-base lg:text-lg mb-8 leading-relaxed">
            Premium on-chain intelligence system. Track smart money and whale
            movements in real-time across Solana and EVM networks.
          </p>
          <div className="flex items-center gap-6 text-xs font-bold text-white/40 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Real-time Radar
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" /> Secured Data
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#121212] relative min-h-screen lg:min-h-0">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] bg-emerald-500/10 blur-[100px] lg:blur-[120px] rounded-full pointer-events-none"></div>

        <div className="lg:hidden mb-8 mt-6 text-center z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
            Auth Node
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
            Predator <span className="text-emerald-400">Tracker</span>
          </h1>
        </div>

        <div className="relative z-10 w-full max-w-[400px]">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#10b981",
                colorBackground: "#0d0d0d",
                colorText: "#ffffff",
                colorTextSecondary: "#ffffff",
                colorInputText: "#ffffff",
                colorInputBackground: "#1e1e20",
              },
              elements: {
                cardBox: "w-full shadow-2xl m-0",
                card: "bg-[#0d0d0d] border border-white/20 shadow-2xl rounded-3xl overflow-hidden w-full m-0",
                headerTitle:
                  "text-white font-black text-2xl uppercase tracking-tight",
                headerSubtitle: "text-white/70",
                socialButtonsBlockButton:
                  "border border-white/20 text-white hover:bg-white/10 transition-colors bg-white/5",
                socialButtonsBlockButtonText: "font-bold text-white",
                dividerLine: "bg-white/40",
                dividerText:
                  "text-white font-black uppercase text-xs opacity-100",
                formFieldLabel:
                  "!text-white !font-black uppercase tracking-widest text-[10px] mb-2 opacity-100",

                formFieldInput:
                  "!bg-[#1e1e20] !border !border-white/30 !text-white !font-bold focus:!border-emerald-500 rounded-xl py-3 px-4 placeholder:!text-white/40",

                otpCodeFieldInput:
                  "!bg-[#1e1e20] !border !border-white/30 !text-white !font-black !text-2xl focus:!border-emerald-500 rounded-xl",

                formFieldInputShowPasswordButton:
                  "!text-white/80 hover:!text-white transition-colors",

                formButtonPrimary:
                  "bg-white text-black hover:bg-emerald-400 font-black uppercase tracking-tighter py-3 rounded-xl transition-colors mt-2",
                footer: "hidden", // 🔥 KITA HIDE FOOTER BAWAAN CLERK

                identityPreviewText: "!text-white !font-bold",
                identifier: "!text-white !font-bold",
                userPreviewMainIdentifier: "!text-white !font-bold",

                watermark:
                  "!text-white !invert !brightness-200 !opacity-100 hover:!opacity-100 transition-all",
              },
            }}
          />

          {/* 🔥 TOMBOL DAFTAR MANUAL 🔥 */}
          <div className="mt-4 bg-[#0d0d0d] border border-white/20 rounded-3xl p-5 text-center shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
            <p className="text-xs text-white/70 font-bold mb-3 relative z-10">
              Need access to the intelligence system?
            </p>
            <a
              href="/sign-up"
              className="relative z-10 inline-block w-full py-3.5 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
