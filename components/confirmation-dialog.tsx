'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

type ConfirmationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSend: (date: string, location: string, price: string) => void;
};

export default function ConfirmationDialog({ isOpen, onClose, onSend }: ConfirmationDialogProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Strip everything except digits and decimal point
    value = value.replace(/[^\d.]/g, '');
    
    // Remove leading zeros (keep "0." for decimals like "0.50")
    if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
      value = value.replace(/^0+/, '');
    }
    
    // Only allow one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setPrice(value);
  };

  const handlePriceBlur = () => {
    if (!price) return;
    // Format nicely on blur: ensure two decimal places
    const num = parseFloat(price);
    if (!isNaN(num) && num > 0) {
      setPrice(num.toFixed(2));
    } else {
      setPrice('');
    }
  };

  const formatDateForDisplay = (dateStr: string, timeStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const formatted = d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
    if (!timeStr) return formatted;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${formatted} at ${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price);
    if (date && location.trim() && !isNaN(numericPrice) && numericPrice > 0) {
      const displayDate = formatDateForDisplay(date, time);
      onSend(displayDate, location.trim(), `$${numericPrice.toFixed(2)}`);
      setDate('');
      setTime('');
      setLocation('');
      setPrice('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md m-4">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Send Confirmation</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">
                  Date:
                </label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="time" className="text-sm font-medium">
                  Time:
                </label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location:
              </label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., CMU Campus, Gates Building"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  placeholder="0.00"
                  className="pl-7"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 border-0 text-white"
                style={{
                  background: 'linear-gradient(to right, #4a2db8, #a78bfa)',
                }}
              >
                Send
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

