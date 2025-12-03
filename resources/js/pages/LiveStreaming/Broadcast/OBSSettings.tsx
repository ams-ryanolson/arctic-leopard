import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePage, Link } from '@inertiajs/react';
import { Copy, Check, Settings, Radio } from 'lucide-react';
import { type SharedData } from '@/types';
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
    const rtmpUrl = stream?.rtmp_url || 'rtmp://mock-server.example.com/stream/mock-key';

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
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Settings className="size-8" />
                        OBS Settings
                    </h1>
                    <p className="text-white/60">
                        Configure OBS Studio to stream to this platform
                    </p>
                </div>

                {/* Connection Status */}
                <Card className="bg-white/5 border-white/10 mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-semibold mb-1">Connection Status</p>
                                <p className="text-white/60 text-sm">Mock Mode - Ready to Stream</p>
                            </div>
                            <div className="flex items-center gap-2 text-green-400">
                                <div className="size-3 rounded-full bg-green-400 animate-pulse"></div>
                                <span className="text-sm font-medium">Ready</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stream Key */}
                <Card className="bg-white/5 border-white/10 mb-6">
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
                            <div className="flex gap-2 mt-1">
                                <Input
                                    id="streamKey"
                                    value={streamKey}
                                    readOnly
                                    className="bg-white/10 border-white/20 text-white font-mono text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => copyToClipboard(streamKey, 'key')}
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
                <Card className="bg-white/5 border-white/10 mb-6">
                    <CardHeader>
                        <CardTitle className="text-white">RTMP Server URL</CardTitle>
                        <CardDescription className="text-white/60">
                            The server URL for OBS to connect to
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="rtmpUrl" className="text-white">
                                RTMP URL
                            </Label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    id="rtmpUrl"
                                    value={rtmpUrl}
                                    readOnly
                                    className="bg-white/10 border-white/20 text-white font-mono text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => copyToClipboard(rtmpUrl, 'url')}
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
                <Card className="bg-white/5 border-white/10 mb-6">
                    <CardHeader>
                        <CardTitle className="text-white">OBS Setup Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-white/80">
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>Open OBS Studio</li>
                            <li>Go to Settings → Stream</li>
                            <li>Set Service to &quot;Custom&quot;</li>
                            <li>Paste the RTMP URL into the Server field</li>
                            <li>Paste the Stream Key into the Stream Key field</li>
                            <li>Click OK to save settings</li>
                            <li>Click &quot;Start Streaming&quot; in OBS</li>
                        </ol>
                        <div className="mt-4 p-4 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                            <p className="text-amber-400 text-sm font-medium">
                                Note: This is a mock implementation. In production, these credentials will connect to a real streaming service.
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
                        <Button type="button" variant="secondary" className="gap-2">
                            <Radio className="size-4" />
                            View Live Streams
                        </Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}

