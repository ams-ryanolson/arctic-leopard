import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = () => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
};

export function initializeTheme() {
    localStorage.setItem('appearance', 'dark');
    setCookie('appearance', 'dark');
    applyTheme();
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('dark');

    const updateAppearance = useCallback(() => {
        setAppearance('dark');
        localStorage.setItem('appearance', 'dark');
        setCookie('appearance', 'dark');
        applyTheme();
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        updateAppearance();

        return () => undefined;
    }, [updateAppearance]);

    return { appearance, updateAppearance } as const;
}
