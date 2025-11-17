import { cn } from '@/lib/utils';
import type { Attachment } from './types';

type MessageAttachmentProps = {
    attachment: Attachment;
};

export default function MessageAttachment({
    attachment,
}: MessageAttachmentProps) {
    return (
        <figure
            className={cn(
                'overflow-hidden rounded-xl border border-white/20 bg-black/30 shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl',
                attachment.type === 'audio'
                    ? 'p-4'
                    : attachment.type === 'video'
                      ? 'max-h-96'
                      : 'max-h-80',
            )}
        >
            {attachment.type === 'image' && attachment.url ? (
                <img
                    src={attachment.optimized_url ?? attachment.url}
                    alt={attachment.filename}
                    className="h-full w-full object-cover"
                />
            ) : attachment.type === 'audio' && attachment.url ? (
                <div className="space-y-2">
                    <audio
                        src={attachment.url}
                        controls
                        className="h-10 w-full rounded-lg"
                        preload="metadata"
                    >
                        Your browser does not support the audio element.
                    </audio>
                    {attachment.filename && (
                        <p className="truncate text-xs text-white/60">
                            {attachment.filename}
                        </p>
                    )}
                </div>
            ) : attachment.type === 'video' && attachment.url ? (
                <video
                    src={attachment.url}
                    controls
                    className="h-full w-full rounded-lg object-cover"
                    preload="metadata"
                >
                    Your browser does not support the video element.
                </video>
            ) : (
                <div className="p-4 text-xs tracking-[0.3em] text-white/50 uppercase">
                    {attachment.filename}
                </div>
            )}
        </figure>
    );
}
