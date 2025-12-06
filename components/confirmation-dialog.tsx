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
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('$0.00');

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove all non-digit characters except decimal point
    value = value.replace(/[^\d.]/g, '');
    
    // Remove leading zeros (but keep one zero if it's just "0" or "0.")
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      value = value.replace(/^0+/, '') || '0';
    }
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    // Format with $ prefix and ensure .00 if no decimals
    if (value === '' || value === '.') {
      setPrice('$0.00');
    } else if (!value.includes('.')) {
      setPrice(`$${value}.00`);
    } else if (value.endsWith('.')) {
      setPrice(`$${value}00`);
    } else if (parts.length === 2 && parts[1].length === 1) {
      setPrice(`$${value}0`);
    } else {
      setPrice(`$${value}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceValue = price.replace('$', '').trim();
    if (date.trim() && location.trim() && priceValue && priceValue !== '0.00') {
      onSend(date.trim(), location.trim(), price);
      setDate('');
      setLocation('');
      setPrice('$0.00');
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
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                Date:
              </label>
              <Input
                id="date"
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g., Dec 10, 2024"
                required
              />
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
              <Input
                id="price"
                type="text"
                value={price}
                onChange={handlePriceChange}
                placeholder="$0.00"
                required
              />
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

