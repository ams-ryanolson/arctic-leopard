export function getCsrfToken(): string | undefined {
    if (typeof document === 'undefined') {
        return undefined;
    }

    const prefix = 'XSRF-TOKEN=';
    const entry = document.cookie.split('; ').find((row) => row.startsWith(prefix));

    if (!entry) {
        return undefined;
    }

    const value = entry.slice(prefix.length);

    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}







