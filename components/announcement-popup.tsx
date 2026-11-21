'use client';

import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
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
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-primary/20 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="relative p-8 md:p-10">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            aria-label="Close announcement"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Upgrading Our Capacity
            </h3>

            <p className="text-slate-600 leading-relaxed text-lg mb-8">
              Thanks to your incredible support, CollegeCart has seen more traffic than our current plan could handle!
              <span className="block mt-4 font-semibold text-primary">
                All listings will return on April 4th when our plan upgrades!
              </span>
            </p>

            <Button
              onClick={handleClose}
              className="h-11 w-full"
            >
              Got it, see you then!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
