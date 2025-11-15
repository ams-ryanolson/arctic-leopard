export default function HeadingSmall({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <header>
            <h3 className="mb-0.5 text-base font-medium text-white">{title}</h3>
            {description && (
                <p className="text-sm text-white/60">{description}</p>
            )}
        </header>
    );
}
