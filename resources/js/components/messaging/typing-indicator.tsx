type TypingIndicatorProps = {
    users: string[];
};

export default function TypingIndicator({ users }: TypingIndicatorProps) {
    if (users.length === 0) {
        return null;
    }

    return (
        <div className="px-6 pb-2 text-[0.65rem] uppercase tracking-[0.3em] text-amber-200">
            {users.join(', ')} {users.length > 1 ? 'are' : 'is'} typing…
        </div>
    );
}




