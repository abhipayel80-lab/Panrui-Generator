import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, X, Info } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstalled, triggerInstall, deferredPrompt } = usePWAInstall();
  const [showHelper, setShowHelper] = useState(false);

  // Requirement 4: After successful installation, hide the Install App button
  if (isInstalled) {
    return null;
  }

  // Requirements 1, 3 & 5:
  // Button is always visible when not installed.
  // When clicked, triggers beforeinstallprompt if available.
  // If not yet available in browser, shows helpful in-app dialog (without redirecting).
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      const outcome = await triggerInstall();
      if (outcome === 'accepted') {
        setShowHelper(false);
      }
    } else {
      setShowHelper(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-xs cursor-pointer shrink-0"
        title="Install Generator"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>

      {/* Non-redirecting helper modal shown ONLY if the browser hasn't fired beforeinstallprompt yet */}
      {showHelper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-sm p-4 relative">
            <button
              onClick={() => setShowHelper(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Install Generator</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              To install this application on your device:
            </p>
            <ul className="mt-2 text-xs text-slate-600 space-y-1 list-disc pl-4">
              <li>
                Click the <strong>Install</strong> icon (⊕ or ⬇) in your browser address bar.
              </li>
              <li>
                Or open the browser menu (<strong>⋮</strong>) and select <strong>Install Generator</strong>.
              </li>
            </ul>
            <button
              onClick={() => setShowHelper(false)}
              className="mt-4 w-full py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
