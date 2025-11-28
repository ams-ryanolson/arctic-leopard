import { formatDateSeparator } from './message-utils';

type DateSeparatorProps = {
    date: string;
};

export default function DateSeparator({ date }: DateSeparatorProps) {
    const formattedDate = formatDateSeparator(date);

    if (!formattedDate) {
        return null;
    }

    return (
        <div className="flex items-center gap-4 py-4">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-xs font-medium tracking-wider text-white/50 uppercase">
                {formattedDate}
            </span>
            <div className="flex-1 border-t border-white/10" />
        </div>
    );
}


