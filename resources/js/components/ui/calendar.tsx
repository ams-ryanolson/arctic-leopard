import { type ForwardedRef, forwardRef } from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';

import 'react-day-picker/dist/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CalendarComponent(
    { className, classNames, showOutsideDays = true, ...props }: CalendarProps,
    ref: ForwardedRef<HTMLDivElement>,
) {
    const mergedClassNames = {
        months: 'flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center text-white',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button:
            'inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-40',
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex text-xs text-white/50',
        head_cell: 'w-9 font-medium uppercase tracking-[0.35em] text-center',
        row: 'flex w-full mt-2',
        cell: cn(
            'relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition',
            'hover:bg-white/10 focus-within:relative focus-within:z-20',
            'aria-disabled:opacity-30 aria-selected:!bg-white aria-selected:!text-black',
        ),
        day: 'h-9 w-9 p-0 font-normal',
        day_selected: 'bg-white text-black shadow',
        day_today: 'border border-white/40 text-white',
        day_outside: 'text-white/40',
        day_disabled: 'text-white/30',
        day_range_middle: 'bg-white/15 text-white',
        day_hidden: 'invisible',
        ...(classNames ?? {}),
    };

    return (
        <DayPicker
            ref={ref}
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={mergedClassNames}
            components={{
                CaptionLabel: ({ displayMonth }) => (
                    <span>{displayMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                ),
            }}
            {...props}
        />
    );
}

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(CalendarComponent);
Calendar.displayName = 'Calendar';
