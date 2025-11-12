import { useEffect, useMemo, useRef, useState } from 'react';

import { getPresenceChannel, leaveEchoChannel } from '@/lib/echo';

export type PresenceMember = {
    id: number;
    name: string | null;
    avatar?: string | null;
};

type CirclePresenceOptions = {
    enabled?: boolean;
};

type RawPresenceMember =
    | PresenceMember
    | {
          id?: number | string;
          name?: string | null;
          avatar?: string | null;
          [key: string]: unknown;
      };

function normalizeMember(member: RawPresenceMember): PresenceMember {
    const idValue = typeof member.id === 'string' ? Number.parseInt(member.id, 10) : member.id;

    return {
        id: Number.isFinite(idValue) ? Number(idValue) : 0,
        name: member.name ?? null,
        avatar: member.avatar ?? null,
    };
}

function uniqueMembers(previous: PresenceMember[], next: PresenceMember): PresenceMember[] {
    if (next.id === 0) {
        return previous;
    }

    const existingIndex = previous.findIndex((member) => member.id === next.id);

    if (existingIndex !== -1) {
        const clone = [...previous];
        clone[existingIndex] = next;

        return clone;
    }

    return [...previous, next];
}

export function useCirclePresence(
    circleIdentifier: number | string | null | undefined,
    options: CirclePresenceOptions = {},
): {
    members: PresenceMember[];
    count: number;
    isSubscribed: boolean;
} {
    const { enabled = true } = options;
    const [members, setMembers] = useState<PresenceMember[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const identifierRef = useRef(circleIdentifier);

    identifierRef.current = circleIdentifier;

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') {
            return undefined;
        }

        const identifier = identifierRef.current;

        if (identifier === null || identifier === undefined || identifier === '') {
            return undefined;
        }

        const channelName = `circles.${identifier}`;
        const channel = getPresenceChannel(channelName);

        if (!channel) {
            return undefined;
        }

        const handleHere = (initialMembers: RawPresenceMember[]) => {
            setMembers(initialMembers.map(normalizeMember));
            setIsSubscribed(true);
        };

        const handleJoining = (member: RawPresenceMember) => {
            setMembers((current) => uniqueMembers(current, normalizeMember(member)));
        };

        const handleLeaving = (member: RawPresenceMember) => {
            const normalized = normalizeMember(member);

            setMembers((current) => current.filter((entry) => entry.id !== normalized.id));
        };

        channel.here?.(handleHere);
        channel.joining?.(handleJoining);
        channel.leaving?.(handleLeaving);

        return () => {
            leaveEchoChannel(channelName);
            setIsSubscribed(false);
            setMembers([]);
        };
    }, [enabled]);

    const count = useMemo(() => members.length, [members]);

    return {
        members,
        count,
        isSubscribed,
    };
}


