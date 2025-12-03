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
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';
import { Check, Copy, Radio, Settings } from 'lucide-react';
import { useState } from 'react';

interface OBSSettingsProps {
    stream?: {
        stream_key: string;
        rtmp_url: string;
    };
}

export default function OBSSettings({ stream }: OBSSettingsProps) {
    const [copiedStreamKey, setCopiedStreamKey] = useState(false);
    const [copiedRtmpUrl, setCopiedRtmpUrl] = useState(false);

    const streamKey = stream?.stream_key || 'mock-stream-key-placeholder';
    const rtmpUrl =
        stream?.rtmp_url || 'rtmp://mock-server.example.com/stream/mock-key';

    const copyToClipboard = (text: string, type: 'key' | 'url') => {
        navigator.clipboard.writeText(text).then(() => {
            if (type === 'key') {
                setCopiedStreamKey(true);
                setTimeout(() => setCopiedStreamKey(false), 2000);
            } else {
                setCopiedRtmpUrl(true);
                setTimeout(() => setCopiedRtmpUrl(false), 2000);
            }
        });
    };

    return (
        <AppLayout>
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-white">
                        <Settings className="size-8" />
                        OBS Settings
                    </h1>
                    <p className="text-white/60">
                        Configure OBS Studio to stream to this platform
                    </p>
                </div>

                {/* Connection Status */}
                <Card className="mb-6 border-white/10 bg-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="mb-1 font-semibold text-white">
                                    Connection Status
                                </p>
                                <p className="text-sm text-white/60">
                                    Mock Mode - Ready to Stream
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-green-400">
                                <div className="size-3 animate-pulse rounded-full bg-green-400"></div>
                                <span className="text-sm font-medium">
                                    Ready
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stream Key */}
                <Card className="mb-6 border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="text-white">Stream Key</CardTitle>
                        <CardDescription className="text-white/60">
                            Your unique stream key (keep this secret!)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="streamKey" className="text-white">
                                Stream Key
                            </Label>
                            <div className="mt-1 flex gap-2">
                                <Input
                                    id="streamKey"
                                    value={streamKey}
                                    readOnly
                                    className="border-white/20 bg-white/10 font-mono text-sm text-white"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        copyToClipboard(streamKey, 'key')
                                    }
                                    className="gap-2"
                                >
                                    {copiedStreamKey ? (
                                        <>
                                            <Check className="size-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-4" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* RTMP URL */}
                <Card className="mb-6 border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="text-white">
                            RTMP Server URL
                        </CardTitle>
                        <CardDescription className="text-white/60">
                            The server URL for OBS to connect to
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="rtmpUrl" className="text-white">
                                RTMP URL
                            </Label>
                            <div className="mt-1 flex gap-2">
                                <Input
                                    id="rtmpUrl"
                                    value={rtmpUrl}
                                    readOnly
                                    className="border-white/20 bg-white/10 font-mono text-sm text-white"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        copyToClipboard(rtmpUrl, 'url')
                                    }
                                    className="gap-2"
                                >
                                    {copiedRtmpUrl ? (
                                        <>
                                            <Check className="size-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-4" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Setup Instructions */}
                <Card className="mb-6 border-white/10 bg-white/5">
                    <CardHeader>
                        <CardTitle className="text-white">
                            OBS Setup Instructions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-white/80">
                        <ol className="ml-2 list-inside list-decimal space-y-2">
                            <li>Open OBS Studio</li>
                            <li>Go to Settings → Stream</li>
                            <li>Set Service to &quot;Custom&quot;</li>
                            <li>Paste the RTMP URL into the Server field</li>
                            <li>
                                Paste the Stream Key into the Stream Key field
                            </li>
                            <li>Click OK to save settings</li>
                            <li>Click &quot;Start Streaming&quot; in OBS</li>
                        </ol>
                        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/20 p-4">
                            <p className="text-sm font-medium text-amber-400">
                                Note: This is a mock implementation. In
                                production, these credentials will connect to a
                                real streaming service.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <Link href="/live/broadcast/start">
                        <Button type="button" variant="outline">
                            Back to Setup
                        </Button>
                    </Link>
                    <Link href="/live">
                        <Button
                            type="button"
                            variant="secondary"
                            className="gap-2"
                        >
                            <Radio className="size-4" />
                            View Live Streams
                        </Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
