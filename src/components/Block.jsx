"use client"
import { useBlock } from '@/hooks/useBlocks';
import { useEffect } from 'react';

const Block = ({ 
  slug, 
  className = "", 
  fallback = null, 
  onLoad = null,
  onError = null 
}) => {
  const { block, loading, error } = useBlock(slug);

  useEffect(() => {
    if (block && onLoad) {
      onLoad(block);
    }
  }, [block, onLoad]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Inject custom CSS and JS when block loads
  useEffect(() => {
    if (!block) return;

    let styleElement, scriptElement;

    // Inject custom CSS
    if (block.customCSS) {
      styleElement = document.createElement('style');
      styleElement.textContent = block.customCSS;
      styleElement.setAttribute('data-block-slug', slug);
      document.head.appendChild(styleElement);
    }

    // Inject custom JS
    if (block.customJS) {
      scriptElement = document.createElement('script');
      scriptElement.textContent = block.customJS;
      scriptElement.setAttribute('data-block-slug', slug);
      document.body.appendChild(scriptElement);
    }

    // Cleanup function
    return () => {
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
      if (scriptElement) {
        document.body.removeChild(scriptElement);
      }
    };
  }, [block, slug]);

  if (loading) {
    return (
      <div className={`block-loading ${className}`}>
        <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
      </div>
    );
  }

  if (error) {
    if (fallback) {
      return fallback;
    }
    return (
      <div className={`block-error ${className}`}>
        <p className="text-red-500 text-sm">Failed to load block: {error}</p>
      </div>
    );
  }

  if (!block) {
    return fallback;
  }

  const renderContent = () => {
    switch (block.type) {
      case 'html':
        return (
          <div 
            className="block-html-content"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
      
      case 'text':
        return (
          <div 
            className="block-text-content prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
      
      case 'form':
        // For form blocks, you might want to parse and render form elements
        return (
          <div 
            className="block-form-content"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
      
      case 'layout':
        return (
          <div 
            className="block-layout-content"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
      
      default:
        return (
          <div 
            className="block-default-content"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
    }
  };

  return (
    <div 
      className={`block block-${block.type} ${className}`}
      data-block-slug={slug}
      data-block-id={block.id}
    >
      {renderContent()}
    </div>
  );
};

export default Block;
