import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, Smartphone, Terminal, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const SHARED_APP_URL =
  'https://ais-pre-s7av26aff6nsfwcrsumhhz-147390039613.asia-southeast1.run.app';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}

export const ApkInstallModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const liveUrl =
    typeof window !== 'undefined' &&
    window.location.origin.includes('.run.app')
      ? window.location.origin
      : SHARED_APP_URL;

  const capacitorCommands = `npm install @capacitor/core@^6.0.0 @capacitor/cli@^6.0.0 @capacitor/android@^6.0.0
npx cap add android
npm run build && npx cap sync android
printf "\\nsubprojects { configurations.configureEach { resolutionStrategy { force 'org.jetbrains.kotlin:kotlin-stdlib:1.8.22', 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22', 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22' } } }\\n" >> android/build.gradle
cd android && ./gradlew assembleDebug`;

  const copyText = async (text: string, type: 'url' | 'cmd') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedCmd(true);
        setTimeout(() => setCopiedCmd(false), 2000);
      }
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
      data-testid="apk-install-modal"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-[#161B22] border border-slate-700 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0D1117]">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white">
                Android APK Download &amp; Mobile App Install
              </h2>
              <p className="text-xs text-slate-400">
                PWA Manifest, Offline Service Worker &amp; Capacitor Android Config Ready
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close APK modal"
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          {/* Option 1: Direct One-Click App Install */}
          <div className="p-4 rounded-md bg-emerald-950/30 border border-emerald-500/40 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono-hud uppercase tracking-wider text-emerald-300 font-bold">
                Method 1 · Direct Mobile App Install (No APK File Needed)
              </span>
              {isInstalled && (
                <span className="text-xs font-mono-hud text-emerald-400">
                  ✓ Installed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              আপনার Android ফোনের <strong>Chrome Browser</strong> দিয়ে নিচের Live Game Link-টি ওপেন করুন, তারপর ব্রাউজারের ডানপাশের <strong>⋮ (Three Dots Menu) → &quot;Install App&quot; / &quot;Add to Home Screen&quot;</strong> চাপুন। গেমটি ফুল-স্ক্রিন মোবাইল অ্যাপ হিসেবে ইনস্টল হয়ে যাবে।
            </p>
            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={install}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Install EliteStrike App Now</span>
              </button>
            )}
            {isIOS && !isInstalled && (
              <p className="text-xs text-amber-300">
                iPhone / iPad Safari: Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.
              </p>
            )}
          </div>

          {/* Option 2: 1-Minute .APK File Generator via PWABuilder */}
          <div className="p-4 rounded-md bg-[#0D1117] border border-slate-700/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-hud uppercase tracking-wider text-amber-400 font-bold">
                Method 2 · 1-Minute .APK File Download (PWABuilder / WebIntoApp)
              </span>
              <span className="text-[11px] font-mono-hud text-emerald-400">
                Manifest + Icons + SW Configured
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              সরাসরি <code>.apk</code> ফাইল ডাউনলোড করতে নিচের ধাপগুলো অনুসরণ করুন (এই প্রজেক্টে <code>manifest.json</code>, <code>512×512 PNG icons</code> এবং <code>sw.js</code> যুক্ত করা হয়েছে):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
              <li>নিচের <strong>Copy Live Game URL</strong> বাটনে ক্লিক করে গেমের লিংকটি কপি করুন।</li>
              <li>
                <strong>pwabuilder.com</strong> অথবা <strong>webintoapp.com</strong> ওয়েবসাইটে যান এবং কপি করা লিংকটি পেস্ট করুন।
              </li>
              <li>
                <strong>Package for Stores → Android → Download APK</strong> চাপলেই সরাসরি আপনার ফোনে বা পিসিতে <code>EliteStrike.apk</code> ডাউনলোড হয়ে যাবে।
              </li>
            </ol>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={liveUrl}
                aria-label="Live Game URL"
                className="flex-1 px-3 py-2 rounded bg-[#161B22] border border-slate-700 font-mono-hud text-xs text-sky-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => copyText(liveUrl, 'url')}
                className="px-3.5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Live Game URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 3: Local Capacitor Android Studio Build */}
          <div className="p-4 rounded-md bg-[#0D1117] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-hud uppercase tracking-wider text-sky-400 font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Method 3 · Local Android APK Build (Capacitor CLI)</span>
              </span>
              <button
                type="button"
                onClick={() => copyText(capacitorCommands, 'cmd')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono-hud flex items-center gap-1 transition-colors"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              প্রজেক্টে <code>capacitor.config.json</code> যুক্ত করা আছে। কোড ডাউনলোড করে আপনার পিসিতে এই কমান্ড চালালে <code>android/app/build/outputs/apk/debug/app-debug.apk</code> তৈরি হবে:
            </p>
            <pre className="p-3 rounded bg-[#161B22] border border-slate-800 font-mono-hud text-[11px] text-slate-300 overflow-x-auto">
              {capacitorCommands}
            </pre>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-[#0D1117] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
