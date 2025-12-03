import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { suggest as circlesSuggest } from '@/routes/circles';
import { useForm } from '@inertiajs/react';
import { Lightbulb } from 'lucide-react';
import { useCallback, useState } from 'react';

type SuggestCircleDialogProps = {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export function SuggestCircleDialog({
    trigger,
    open: controlledOpen,
    onOpenChange,
}: SuggestCircleDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;

    const setOpen = useCallback(
        (value: boolean) => {
            if (controlledOpen === undefined) {
                setInternalOpen(value);
            }

            onOpenChange?.(value);
        },
        [controlledOpen, onOpenChange],
    );

    const form = useForm({
        name: '',
        description: '',
    });

    const handleSubmit = useCallback(() => {
        form.post(circlesSuggest.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    }, [form, setOpen]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button className="rounded-full bg-white px-6 text-xs font-semibold tracking-[0.35em] text-black uppercase">
                        Suggest a circle
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-black/90 text-white shadow-[0_60px_120px_-70px_rgba(249,115,22,0.75)] backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">
                        Suggest a new circle
                    </DialogTitle>
                    <DialogDescription className="text-sm text-white/60">
                        Have an idea for a circle that doesn't exist yet? Share
                        it with us and we'll review it.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="circle-name">Circle name</Label>
                        <Input
                            id="circle-name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            className="rounded-2xl border-white/20 bg-black/40 text-white placeholder:text-white/40 focus-visible:ring-amber-400/40"
                            placeholder="e.g., Leather Daddies"
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="circle-description">Description</Label>
                        <textarea
                            id="circle-description"
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                            className="flex min-h-[120px] w-full rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Describe what this circle would be about, who it's for, and what kind of community it would foster..."
                            rows={5}
                        />
                        <InputError message={form.errors.description} />
                    </div>

                    <div className="space-y-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                        <p className="flex items-center gap-2 text-sm font-medium text-amber-100">
                            <Lightbulb className="size-4" />
                            Important notes
                        </p>
                        <ul className="list-inside list-disc space-y-1.5 text-xs text-amber-100/80">
                            <li>
                                Circles are meant to be groups of people and
                                should not be too specific
                            </li>
                            <li>
                                We reserve the right to modify the name to match
                                the site's standards
                            </li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setOpen(false)}
                            disabled={form.processing}
                            className="rounded-full border-white/20 bg-white/10 px-5 text-xs font-medium text-white transition-colors hover:border-white/30 hover:bg-white/15"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={form.processing}
                            className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-5 text-xs font-semibold text-white shadow-[0_18px_40px_-20px_rgba(249,115,22,0.6)] transition-all hover:scale-[1.02] hover:shadow-[0_22px_50px_-20px_rgba(249,115,22,0.7)]"
                        >
                            {form.processing
                                ? 'Submitting...'
                                : 'Submit suggestion'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
