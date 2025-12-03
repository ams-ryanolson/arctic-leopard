type TypingUser = {
    id: number;
    name: string;
};

type TypingIndicatorProps = {
    users: TypingUser[];
};

export default function TypingIndicator({ users }: TypingIndicatorProps) {
    if (users.length === 0) {
        return null;
    }

    const names = users.map((u) => u.name).join(', ');

    return (
        <div className="px-6 pb-2 text-[0.65rem] tracking-[0.3em] text-amber-200 uppercase">
            {names} {users.length > 1 ? 'are' : 'is'} typing…
        </div>
    );
}
