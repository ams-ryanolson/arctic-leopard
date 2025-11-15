import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react';
import { FormEvent, useState } from 'react';

type AdminSetting = {
    key: string;
    value: string | number | boolean;
    description: string | null;
    type: 'string' | 'integer' | 'boolean' | 'json';
    category: string;
};

type AdminSettingsPageProps = {
    settings: AdminSetting[];
    categories: string[];
    selectedCategory: string;
};

export default function AdminSettingsIndex({
    settings,
    categories,
    selectedCategory,
}: AdminSettingsPageProps) {
    const [processing, setProcessing] = useState<string | null>(null);
    const [values, setValues] = useState<Record<string, string | number | boolean>>(() => {
        const initial: Record<string, string | number | boolean> = {};
        settings.forEach((setting) => {
            initial[setting.key] = setting.value;
        });
        return initial;
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>, key: string) => {
        e.preventDefault();
        if (processing) {
            return;
        }

        setProcessing(key);

        router.patch(
            `/admin/settings/${key}`,
            { value: values[key] },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(null),
            },
        );
    };

    const verificationSettings = settings.filter((s) => s.category === 'verification');
    const otherSettings = settings.filter((s) => s.category !== 'verification');

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Admin', href: '/admin' },
                { title: 'Settings', href: '/admin/settings' },
            ]}
        >
            <Head title="Admin Settings" />

            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Admin Settings</h1>
                    <p className="mt-2 text-sm text-white/70">
                        Manage application-wide configuration settings
                    </p>
                </div>

                {verificationSettings.length > 0 && (
                    <Card className="border-violet-400/20 bg-violet-400/5">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <SettingsIcon className="size-5 text-violet-300" />
                                <CardTitle className="text-white">Verification Settings</CardTitle>
                            </div>
                            <CardDescription className="text-white/70">
                                Configure ID verification expiration periods and provider settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {verificationSettings.map((setting) => (
                                <form
                                    key={setting.key}
                                    onSubmit={(e) => handleSubmit(e, setting.key)}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor={setting.key} className="text-white">
                                            {setting.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </Label>
                                        {setting.description && (
                                            <p className="text-xs text-white/60">{setting.description}</p>
                                        )}
                                        {setting.type === 'integer' && (
                                            <Input
                                                id={setting.key}
                                                type="number"
                                                value={values[setting.key] as number}
                                                onChange={(e) =>
                                                    setValues({
                                                        ...values,
                                                        [setting.key]: parseInt(e.target.value, 10),
                                                    })
                                                }
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        )}
                                        {setting.type === 'boolean' && (
                                            <Select
                                                value={String(values[setting.key])}
                                                onValueChange={(value) =>
                                                    setValues({
                                                        ...values,
                                                        [setting.key]: value === 'true',
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="true">True</SelectItem>
                                                    <SelectItem value="false">False</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {setting.type === 'string' && (
                                            <Input
                                                id={setting.key}
                                                type="text"
                                                value={String(values[setting.key])}
                                                onChange={(e) =>
                                                    setValues({
                                                        ...values,
                                                        [setting.key]: e.target.value,
                                                    })
                                                }
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing === setting.key}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {processing === setting.key ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="size-4" />
                                                Save
                                            </>
                                        )}
                                    </Button>
                                </form>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {otherSettings.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-white">Other Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {otherSettings.map((setting) => (
                                <form
                                    key={setting.key}
                                    onSubmit={(e) => handleSubmit(e, setting.key)}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor={setting.key} className="text-white">
                                            {setting.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </Label>
                                        {setting.description && (
                                            <p className="text-xs text-white/60">{setting.description}</p>
                                        )}
                                        <Input
                                            id={setting.key}
                                            type="text"
                                            value={String(values[setting.key])}
                                            onChange={(e) =>
                                                setValues({
                                                    ...values,
                                                    [setting.key]: e.target.value,
                                                })
                                            }
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing === setting.key}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {processing === setting.key ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="size-4" />
                                                Save
                                            </>
                                        )}
                                    </Button>
                                </form>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

