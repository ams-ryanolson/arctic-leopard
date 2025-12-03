import LegalLayout from '@/layouts/legal-layout';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Cookie,
    FileText,
    Gavel,
    Scale,
    Shield,
} from 'lucide-react';

interface LegalPage {
    slug: string;
    title: string;
    description: string;
    href: string;
}

interface LegalIndexProps {
    legalPages: LegalPage[];
}

const iconMap: Record<string, typeof FileText> = {
    terms: FileText,
    privacy: Shield,
    guidelines: Scale,
    cookies: Cookie,
    dmca: Gavel,
};

export default function LegalIndex({ legalPages }: LegalIndexProps) {
    return (
        <LegalLayout title="Legal">
            <div className="space-y-8">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_60px_-35px_rgba(249,115,22,0.45)] backdrop-blur">
                    <h1 className="text-3xl font-semibold tracking-tight text-white">
                        Legal Information
                    </h1>
                    <p className="mt-2 text-sm text-white/65">
                        Review our legal documents, policies, and guidelines to
                        understand your rights and responsibilities when using
                        our platform.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {legalPages.map((page) => {
                        const Icon = iconMap[page.slug] || FileText;
                        return (
                            <Link
                                key={page.slug}
                                href={page.href}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white">
                                        <Icon className="size-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-white">
                                            {page.title}
                                        </h2>
                                        <p className="mt-1 text-sm text-white/65">
                                            {page.description}
                                        </p>
                                        <div className="mt-4 flex items-center text-sm font-medium text-amber-300 transition group-hover:text-amber-200">
                                            Read more
                                            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </LegalLayout>
    );
}
