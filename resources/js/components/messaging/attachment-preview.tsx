import { Paperclip, X } from 'lucide-react';

type Attachment = {
    id: string;
    filename?: string;
    original_name?: string;
    mime_type?: string;
    size?: number;
    url?: string | null;
    thumbnail_url?: string | null;
};

type AttachmentPreviewProps = {
    attachments: Attachment[];
    onRemove: (id: string) => void;
};

export default function AttachmentPreview({
    attachments,
    onRemove,
}: AttachmentPreviewProps) {
    if (attachments.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {attachments.map((attachment) => (
                <div
                    key={attachment.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                >
                    {attachment.thumbnail_url ? (
                        <img
                            src={attachment.thumbnail_url}
                            alt={
                                attachment.original_name ?? 'Attachment preview'
                            }
                            className="h-32 w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-32 w-full items-center justify-center text-white/50">
                            <Paperclip className="h-6 w-6" />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => onRemove(attachment.id)}
                        className="absolute top-3 right-3 hidden rounded-full bg-black/70 p-2 text-white transition group-hover:flex"
                        aria-label="Remove attachment"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}
        </div>
    );
}


