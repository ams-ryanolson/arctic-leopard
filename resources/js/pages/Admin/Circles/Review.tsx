import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import adminCirclesRoutes from '@/routes/admin/circles';
import { Head, router, useForm } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useState } from 'react';

type Interest = {
    id: number;
    name: string;
    slug: string;
};

type ReviewPageProps = {
    suggestion: {
        id: number;
        name: string;
        description: string | null;
        created_at: string | null;
        user: {
            id: number;
            name: string;
            username: string | null;
        } | null;
    };
    interests: Interest[];
};

export default function AdminCirclesReview({
    suggestion,
    interests,
}: ReviewPageProps) {
    const createForm = useForm({
        interest_id: '',
        name: suggestion.name,
        tagline: '',
        description: suggestion.description || '',
        visibility: 'public',
        is_featured: false,
    });

    const declineForm = useForm({
        admin_notes: '',
    });

    const [showDeclineForm, setShowDeclineForm] = useState(false);

    const handleCreate = () => {
        createForm.post(
            adminCirclesRoutes.suggestions.create(suggestion.id).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Redirect handled by controller
                },
            },
        );
    };

    const handleDecline = () => {
        declineForm.post(
            adminCirclesRoutes.suggestions.decline(suggestion.id).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Redirect handled by controller
                },
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Admin', href: '/admin' },
                { title: 'Circles', href: adminCirclesRoutes.index().url },
                { title: 'Review Suggestion', href: '#' },
            ]}
        >
            <Head title="Review Circle Suggestion · Admin" />

            <div className="space-y-6 text-white">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            router.visit(adminCirclesRoutes.index().url)
                        }
                        className="text-white/70 hover:text-white"
                    >
                        <ArrowLeft className="mr-2 size-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Review Circle Suggestion
                        </h1>
                        <p className="mt-2 text-sm text-white/65">
                            Review and create a circle from this suggestion
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                    <div className="space-y-6">
                        <Card className="border-white/10 bg-black/40 text-white">
                            <CardHeader>
                                <CardTitle>Original Suggestion</CardTitle>
                                <CardDescription>
                                    Details submitted by the user
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs tracking-wider text-white/55 uppercase">
                                        Name
                                    </Label>
                                    <p className="mt-1 text-lg font-medium">
                                        {suggestion.name}
                                    </p>
                                </div>
                                {suggestion.description && (
                                    <div>
                                        <Label className="text-xs tracking-wider text-white/55 uppercase">
                                            Description
                                        </Label>
                                        <p className="mt-1 text-sm text-white/75">
                                            {suggestion.description}
                                        </p>
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-white/55">
                                    {suggestion.user && (
                                        <span>
                                            Suggested by{' '}
                                            <span className="font-medium text-white/75">
                                                {suggestion.user.name}
                                                {suggestion.user.username &&
                                                    ` (@${suggestion.user.username})`}
                                            </span>
                                        </span>
                                    )}
                                    {suggestion.created_at && (
                                        <span>
                                            {formatDistanceToNow(
                                                new Date(suggestion.created_at),
                                                {
                                                    addSuffix: true,
                                                },
                                            )}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-black/40 text-white">
                            <CardHeader>
                                <CardTitle>Create Circle</CardTitle>
                                <CardDescription>
                                    Configure the circle settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="interest_id">
                                        Interest{' '}
                                        <span className="text-rose-400">*</span>
                                    </Label>
                                    <Select
                                        value={createForm.data.interest_id}
                                        onValueChange={(value) =>
                                            createForm.setData(
                                                'interest_id',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="border-white/20 bg-black/40 text-white">
                                            <SelectValue placeholder="Select an interest" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border border-white/10 bg-black/85 text-white">
                                            {interests.map((interest) => (
                                                <SelectItem
                                                    key={interest.id}
                                                    value={String(interest.id)}
                                                >
                                                    {interest.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={createForm.errors.interest_id}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Circle Name{' '}
                                        <span className="text-rose-400">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={createForm.data.name}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        className="border-white/20 bg-black/40 text-white"
                                    />
                                    <InputError
                                        message={createForm.errors.name}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tagline">
                                        Tagline (optional)
                                    </Label>
                                    <Input
                                        id="tagline"
                                        value={createForm.data.tagline}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'tagline',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="A short, catchy tagline"
                                        className="border-white/20 bg-black/40 text-white"
                                    />
                                    <InputError
                                        message={createForm.errors.tagline}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description (optional)
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={createForm.data.description}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        rows={4}
                                        className="border-white/20 bg-black/40 text-white"
                                    />
                                    <InputError
                                        message={createForm.errors.description}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="visibility">
                                        Visibility{' '}
                                        <span className="text-rose-400">*</span>
                                    </Label>
                                    <Select
                                        value={createForm.data.visibility}
                                        onValueChange={(value) =>
                                            createForm.setData(
                                                'visibility',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="border-white/20 bg-black/40 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border border-white/10 bg-black/85 text-white">
                                            <SelectItem value="public">
                                                Public
                                            </SelectItem>
                                            <SelectItem value="listed">
                                                Listed
                                            </SelectItem>
                                            <SelectItem value="private">
                                                Private
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={createForm.errors.visibility}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_featured"
                                        checked={createForm.data.is_featured}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'is_featured',
                                                e.target.checked,
                                            )
                                        }
                                        className="size-4 rounded border-white/20 bg-black/40 text-amber-400 focus:ring-amber-400/40"
                                    />
                                    <Label
                                        htmlFor="is_featured"
                                        className="cursor-pointer"
                                    >
                                        Feature this circle
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-white/10 bg-black/40 text-white">
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    onClick={handleCreate}
                                    disabled={
                                        createForm.processing ||
                                        !createForm.data.interest_id
                                    }
                                    className="w-full rounded-full border-emerald-400/40 bg-emerald-500/20 px-4 text-sm font-medium text-emerald-100 transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/30"
                                >
                                    <Check className="mr-2 size-4" />
                                    Create Circle
                                </Button>

                                {!showDeclineForm ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDeclineForm(true)}
                                        className="w-full rounded-full border-white/20 bg-white/10 text-sm text-white transition-colors hover:border-rose-400/40 hover:bg-rose-500/20 hover:text-rose-50"
                                    >
                                        <X className="mr-2 size-4" />
                                        Decline
                                    </Button>
                                ) : (
                                    <div className="space-y-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="admin_notes"
                                                className="text-rose-100"
                                            >
                                                Admin Notes (optional)
                                            </Label>
                                            <Textarea
                                                id="admin_notes"
                                                value={
                                                    declineForm.data.admin_notes
                                                }
                                                onChange={(e) =>
                                                    declineForm.setData(
                                                        'admin_notes',
                                                        e.target.value,
                                                    )
                                                }
                                                rows={3}
                                                className="border-white/20 bg-black/40 text-white"
                                                placeholder="Reason for declining..."
                                            />
                                            <InputError
                                                message={
                                                    declineForm.errors
                                                        .admin_notes
                                                }
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleDecline}
                                                disabled={
                                                    declineForm.processing
                                                }
                                                className="flex-1 rounded-full border-rose-400/40 bg-rose-500/20 px-4 text-sm font-medium text-rose-100 transition-colors hover:border-rose-400/60 hover:bg-rose-500/30"
                                            >
                                                <X className="mr-2 size-4" />
                                                Confirm Decline
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowDeclineForm(false);
                                                    declineForm.reset();
                                                }}
                                                className="rounded-full border-white/20 bg-white/10 text-sm text-white"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
