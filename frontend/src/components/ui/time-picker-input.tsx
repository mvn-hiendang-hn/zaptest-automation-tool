
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface TimePickerInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange: (value: string) => void;
}

const TimePickerInput = forwardRef<HTMLInputElement, TimePickerInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <Input
        ref={ref}
        type="time"
        value={value as string}
        onChange={handleChange}
        className={cn('w-full', className)}
        {...props}
      />
    );
  }
);

TimePickerInput.displayName = 'TimePickerInput';

export { TimePickerInput };
