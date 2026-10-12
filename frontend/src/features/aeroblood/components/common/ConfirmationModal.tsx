import { Button } from '@/components/ui/button';
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  let btnColor = 'bg-primary hover:bg-primary text-foreground';
  if (confirmVariant === 'primary') {
    btnColor = 'bg-secondary hover:bg-secondary text-foreground';
  } else if (confirmVariant === 'warning') {
    btnColor = 'bg-primary hover:bg-primary text-foreground';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-card rounded-lg shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <AlertCircle className="w-4 h-4 text-blood-light" />
            {title}
          </div>
          <Button variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-md text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 text-xs text-muted-foreground leading-relaxed">
          {description}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 bg-card border-t border-border">
          <Button variant="ghost"
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
          >
            {cancelLabel}
          </Button>
          <Button variant="ghost"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 ${btnColor}`}
          >
            {isLoading && <span className="w-3 h-3 rounded-full border-2 border-border/60 border-t-white animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
