'use client';
import { useBlocks } from '@/hooks/useBlocks';
import Block from './Block';

const BlocksList = ({
    type = null,
    className = '',
    itemClassName = '',
    limit = null,
    fallback = null,
    onLoad = null,
    onError = null
}) => {
    const { blocks, loading, error } = useBlocks({ type });

    if (loading) {
        return (
            <div className={`blocks-list-loading ${className}`}>
                <div className="space-y-4">
                    {Array.from({ length: limit || 3 }).map((_, index) => (
                        <div key={index} className="h-20 animate-pulse rounded bg-gray-200"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        if (onError) onError(error);
        if (fallback) return fallback;
        return (
            <div className={`blocks-list-error ${className}`}>
                <p className="text-red-500 text-sm">Failed to load blocks: {error}</p>
            </div>
        );
    }

    const displayBlocks = limit ? blocks.slice(0, limit) : blocks;

    if (displayBlocks.length === 0) {
        if (fallback) return fallback;
        return (
            <div className={`blocks-list-empty ${className}`}>
                <p className="text-gray-500 text-sm">No blocks found.</p>
            </div>
        );
    }

    if (onLoad) onLoad(displayBlocks);

    return (
        <div className={`blocks-list ${className}`}>
            {displayBlocks.map((block) => (
                <div key={block.id} className={itemClassName}>
                    <Block slug={block.slug} />
                </div>
            ))}
        </div>
    );
};

export default BlocksList;
