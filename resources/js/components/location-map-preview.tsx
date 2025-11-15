import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type LocationMapPreviewProps = {
    latitude: string | number;
    longitude: string | number;
    label?: string;
    className?: string;
};

// Calculate tile coordinates for a given lat/lon and zoom level
function getTileCoordinates(lat: number, lon: number, zoom: number) {
    const n = Math.pow(2, zoom);
    const xTile = Math.floor(((lon + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    const yTile = Math.floor(
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
    );
    return { x: xTile, y: yTile };
}

export function LocationMapPreview({
    latitude,
    longitude,
    label,
    className,
}: LocationMapPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) {
                return;
            }

            const container = containerRef.current;
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const mapSize = 768; // 3x3 tiles at 256px each

            const scaleX = containerWidth / mapSize;
            const scaleY = containerHeight / mapSize;
            // Use the larger scale to ensure the map fills the container
            const newScale = Math.max(scaleX, scaleY);

            setScale(newScale);
        };

        updateScale();
        window.addEventListener('resize', updateScale);

        return () => {
            window.removeEventListener('resize', updateScale);
        };
    }, []);

    if (!latitude || !longitude) {
        return null;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
        return null;
    }

    // Zoom level 16 (approximately 3 zoom clicks in from default)
    const zoom = 16;
    const { x: xTile, y: yTile } = getTileCoordinates(lat, lon, zoom);

    // Calculate which tiles we need for a 3x3 grid centered on the location
    const tiles: Array<{ x: number; y: number; offsetX: number; offsetY: number }> = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            tiles.push({
                x: xTile + dx,
                y: yTile + dy,
                offsetX: dx,
                offsetY: dy,
            });
        }
    }

    // Calculate pixel position of marker within the center tile
    const n = Math.pow(2, zoom);
    const xTileExact = ((lon + 180) / 360) * n;
    const latRad = (lat * Math.PI) / 180;
    const yTileExact = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    
    const pixelX = ((xTileExact - xTile) % 1) * 256;
    const pixelY = ((yTileExact - yTile) % 1) * 256;

    const tileSize = 256;
    const mapSize = tileSize * 3; // 3x3 grid = 768px

    return (
        <div className={cn('relative overflow-hidden rounded-2xl border border-white/10 bg-black/20', className)}>
            {/* Static map using composite tiles */}
            <div ref={containerRef} className="relative h-full w-full overflow-hidden">
                <div 
                    className="absolute left-1/2 top-1/2"
                    style={{
                        width: `${mapSize}px`,
                        height: `${mapSize}px`,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                        transformOrigin: 'center',
                    }}
                >
                    {tiles.map((tile) => (
                        <img
                            key={`${tile.x}-${tile.y}`}
                            src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
                            alt=""
                            className="absolute"
                            style={{
                                left: `${(tile.offsetX + 1) * tileSize}px`,
                                top: `${(tile.offsetY + 1) * tileSize}px`,
                                width: `${tileSize}px`,
                                height: `${tileSize}px`,
                                imageRendering: 'crisp-edges',
                            }}
                        />
                    ))}
                    {/* Marker pin - positioned at exact location */}
                    <div
                        className="absolute z-10"
                        style={{
                            left: `${tileSize + pixelX}px`,
                            top: `${tileSize + pixelY}px`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <div className="relative">
                            <div className="size-6 rounded-full border-2 border-white bg-red-500 shadow-lg" />
                            <div className="absolute inset-0 animate-ping rounded-full border-2 border-red-400 opacity-75" />
                        </div>
                    </div>
                </div>
            </div>
            {label && (
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 py-3 pointer-events-none">
                    <p className="text-sm font-medium text-white">{label}</p>
                </div>
            )}
            <div className="absolute top-3 right-3 z-20">
                <a
                    href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=${zoom}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition hover:border-white/40 hover:bg-black/80 hover:text-white"
                >
                    View larger map
                </a>
            </div>
        </div>
    );
}

