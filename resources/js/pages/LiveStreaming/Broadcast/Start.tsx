import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePage, router, Link, useForm } from '@inertiajs/react';
import { Radio, Video, Settings } from 'lucide-react';
import { type SharedData } from '@/types';
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
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Go Live</h1>
                    <p className="text-white/60">
                        Set up your stream before going live
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Stream Details */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Stream Details</CardTitle>
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
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Enter a title for your stream"
                                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                    required
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-400">{errors.title}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="description" className="text-white">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Tell viewers what your stream is about"
                                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                                    rows={4}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="category" className="text-white">
                                        Category
                                    </Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(value) => setData('category', value)}
                                    >
                                        <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="entertainment">Entertainment</SelectItem>
                                            <SelectItem value="gaming">Gaming</SelectItem>
                                            <SelectItem value="adult">Adult</SelectItem>
                                            <SelectItem value="music">Music</SelectItem>
                                            <SelectItem value="talk">Talk</SelectItem>
                                            <SelectItem value="education">Education</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="visibility" className="text-white">
                                        Visibility
                                    </Label>
                                    <Select
                                        value={data.visibility}
                                        onValueChange={(value) => setData('visibility', value)}
                                    >
                                        <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public">Public</SelectItem>
                                            <SelectItem value="followers">Followers Only</SelectItem>
                                            <SelectItem value="subscribers">Subscribers Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Camera Preview */}
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Video className="size-5" />
                                Camera Preview
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Preview your camera before going live
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative aspect-video bg-gradient-to-br from-rose-500/20 to-violet-600/20 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                                {localVideoReady ? (
                                    <video
                                        id="localVideo"
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <Video className="size-16 text-white/40 mx-auto mb-4" />
                                        <p className="text-white/60 mb-4">
                                            Camera preview will appear here
                                        </p>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                navigator.mediaDevices
                                                    .getUserMedia({ video: true, audio: true })
                                                    .then((stream) => {
                                                        const video = document.getElementById('localVideo') as HTMLVideoElement;
                                                        if (video) {
                                                            video.srcObject = stream;
                                                            setLocalVideoReady(true);
                                                        }
                                                    })
                                                    .catch((error) => {
                                                        console.error('Error accessing camera:', error);
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
                                    <Settings className="size-4 mr-2" />
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

