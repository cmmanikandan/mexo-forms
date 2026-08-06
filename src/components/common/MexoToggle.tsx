import React from 'react';
import * as Switch from '@radix-ui/react-switch';

interface MexoToggleProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export const MexoToggle: React.FC<MexoToggleProps> = ({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  ariaLabel,
  className = '',
}) => {
  return (
    <Switch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`w-11 h-6 bg-slate-200 rounded-full data-[state=checked]:bg-[#7C3AED] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-purple-300 relative flex-shrink-0 cursor-pointer disabled:opacity-50 ${className}`}
    >
      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
    </Switch.Root>
  );
};
