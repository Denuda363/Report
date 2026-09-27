import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 transition active:scale-95"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition active:scale-95"
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-500" /> Install on iOS
              </h3>
              <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
                To install this app on your iPhone or iPad:
              </p>
              <div className="bg-neutral-50 p-4 rounded-lg mt-3 border border-neutral-100">
                <ol className="text-sm text-neutral-700 space-y-3">
                  <li className="flex gap-3">
                    <span className="font-bold text-neutral-900">1.</span>
                    <span>Tap the <strong>Share</strong> button at the bottom of Safari.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-neutral-900">2.</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                  </li>
                </ol>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-lg bg-neutral-900 py-3 text-sm font-bold text-white hover:bg-neutral-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
