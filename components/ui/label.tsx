'use client';

import * as React from 'react';

// This is a generic label primitive; association is supplied by the caller or wrapper.
// oxlint-disable jsx-a11y(label-has-associated-control)

import { cn } from '@/lib/utils';

function Label({ className, htmlFor, ...props }: React.ComponentProps<'label'>) {
  return (
    // Generic labels may associate through a wrapping control or caller-provided htmlFor.
    // oxlint-disable-next-line jsx-a11y(label-has-associated-control)
    <label htmlFor={htmlFor} data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
