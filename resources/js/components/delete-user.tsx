import AccountController from '@/actions/App/Http/Controllers/Settings/AccountController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useRef } from 'react';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl border border-rose-400/40 bg-gradient-to-br from-rose-400/30 to-rose-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(236,72,153,0.65)]">
                    <AlertTriangle className="h-5 w-5 text-rose-300" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-white">
                        Delete account
                    </h2>
                    <p className="text-sm text-white/65">
                        Delete your account and all of its resources
                    </p>
                </div>
            </div>
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5">
                <div className="space-y-4">
                    <div>
                        <p className="mb-1 font-medium text-white">Warning</p>
                        <p className="text-sm leading-relaxed text-white/80">
                            Please proceed with caution, this cannot be undone.
                            Once your account is deleted, all of its resources
                            and data will be permanently deleted.
                        </p>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="destructive"
                                data-test="delete-user-button"
                                className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(239,68,68,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(239,68,68,0.5)]"
                            >
                                Delete account
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="border-white/10 bg-black/95 text-white">
                            <DialogTitle className="text-white">
                                Are you sure you want to delete your account?
                            </DialogTitle>
                            <DialogDescription className="text-white/70">
                                Once your account is deleted, all of its
                                resources and data will also be permanently
                                deleted. Please enter your password to confirm
                                you would like to permanently delete your
                                account.
                            </DialogDescription>

                            <Form
                                {...AccountController.destroy.form()}
                                options={{
                                    preserveScroll: true,
                                }}
                                onError={() => passwordInput.current?.focus()}
                                resetOnSuccess
                                className="space-y-6"
                            >
                                {({
                                    resetAndClearErrors,
                                    processing,
                                    errors,
                                }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="password"
                                                className="sr-only"
                                            >
                                                Password
                                            </Label>

                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                ref={passwordInput}
                                                placeholder="Password"
                                                autoComplete="current-password"
                                            />

                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>

                                        <DialogFooter className="gap-2">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        resetAndClearErrors()
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            </DialogClose>

                                            <Button
                                                variant="destructive"
                                                disabled={processing}
                                                asChild
                                            >
                                                <button
                                                    type="submit"
                                                    data-test="confirm-delete-user-button"
                                                >
                                                    Delete account
                                                </button>
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
