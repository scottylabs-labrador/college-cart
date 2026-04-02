'use client';

import { useState, useEffect } from 'react';
import { X, Info, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnnouncementPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already dismissed this specific announcement
    const isDismissed = localStorage.getItem('announcement_dismissed_april_2026');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('announcement_dismissed_april_2026', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-violet-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="relative p-8 md:p-10">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            aria-label="Close announcement"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-6 rotate-3">
              <Megaphone className="h-8 w-8 text-[#2f167a] -rotate-12" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Wow! Huge Success!
            </h3>

            <p className="text-slate-600 leading-relaxed text-lg mb-8">
              Thanks to your incredible support, CollegeCart has seen more traffic than our current plan could handle! 
              <span className="block mt-4 font-semibold text-[#2f167a]">
                All listings will return on April 4th when our plan upgrades!
              </span>
              See you then!
            </p>

            <Button 
              onClick={handleClose}
              className="w-full bg-[#2f167a] hover:bg-[#1f0e52] text-white rounded-2xl py-6 text-lg font-semibold shadow-lg shadow-violet-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Got it, see you then!
            </Button>
          </div>
        </div>
        <div className="h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
      </div>
    </div>
  );
}
