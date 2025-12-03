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
import { type SharedData } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Radio, Settings, Video } from 'lucide-react';
import { useState } from 'react';

interface BroadcastStartProps {
    // TODO: Add props when form data is implemented
}

export default function BroadcastStart({}: BroadcastStartProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        category: 'entertainment',
        visibility: 'public',
    });

    const [localVideoReady, setLocalVideoReady] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/live/broadcast/start');
    };

    return (
        <AppLayout>
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold text-white">
                        Go Live
                    </h1>
                    <p className="text-white/60">
                        Set up your stream before going live
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Stream Details */}
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-white">
                                Stream Details
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Basic information about your stream
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title" className="text-white">
                                    Stream Title *
                                </Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    placeholder="Enter a title for your stream"
                                    className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                                    required
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-400">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label
                                    htmlFor="description"
                                    className="text-white"
                                >
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder="Tell viewers what your stream is about"
                                    className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                                    rows={4}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-400">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label
                                        htmlFor="category"
                                        className="text-white"
                                    >
                                        Category
                                    </Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(value) =>
                                            setData('category', value)
                                        }
                                    >
                                        <SelectTrigger className="mt-1 border-white/20 bg-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="entertainment">
                                                Entertainment
                                            </SelectItem>
                                            <SelectItem value="gaming">
                                                Gaming
                                            </SelectItem>
                                            <SelectItem value="adult">
                                                Adult
                                            </SelectItem>
                                            <SelectItem value="music">
                                                Music
                                            </SelectItem>
                                            <SelectItem value="talk">
                                                Talk
                                            </SelectItem>
                                            <SelectItem value="education">
                                                Education
                                            </SelectItem>
                                            <SelectItem value="other">
                                                Other
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label
                                        htmlFor="visibility"
                                        className="text-white"
                                    >
                                        Visibility
                                    </Label>
                                    <Select
                                        value={data.visibility}
                                        onValueChange={(value) =>
                                            setData('visibility', value)
                                        }
                                    >
                                        <SelectTrigger className="mt-1 border-white/20 bg-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public">
                                                Public
                                            </SelectItem>
                                            <SelectItem value="followers">
                                                Followers Only
                                            </SelectItem>
                                            <SelectItem value="subscribers">
                                                Subscribers Only
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Camera Preview */}
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Video className="size-5" />
                                Camera Preview
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Preview your camera before going live
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-rose-500/20 to-violet-600/20">
                                {localVideoReady ? (
                                    <video
                                        id="localVideo"
                                        autoPlay
                                        muted
                                        playsInline
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <Video className="mx-auto mb-4 size-16 text-white/40" />
                                        <p className="mb-4 text-white/60">
                                            Camera preview will appear here
                                        </p>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                navigator.mediaDevices
                                                    .getUserMedia({
                                                        video: true,
                                                        audio: true,
                                                    })
                                                    .then((stream) => {
                                                        const video =
                                                            document.getElementById(
                                                                'localVideo',
                                                            ) as HTMLVideoElement;
                                                        if (video) {
                                                            video.srcObject =
                                                                stream;
                                                            setLocalVideoReady(
                                                                true,
                                                            );
                                                        }
                                                    })
                                                    .catch((error) => {
                                                        console.error(
                                                            'Error accessing camera:',
                                                            error,
                                                        );
                                                    });
                                            }}
                                        >
                                            Enable Camera
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <Link href="/live">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <div className="flex gap-3">
                            <Link href="/live/broadcast/obs">
                                <Button type="button" variant="secondary">
                                    <Settings className="mr-2 size-4" />
                                    OBS Settings (Preview)
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing || !data.title.trim()}
                                className="gap-2"
                            >
                                <Radio className="size-4" />
                                {processing ? 'Starting...' : 'Go Live'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
