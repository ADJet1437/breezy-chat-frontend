import React, { useEffect, useRef } from 'react';

interface PresentationPreviewProps {
  htmlContent: string;
}

export function PresentationPreview({ htmlContent }: PresentationPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    // Initialize Shadow DOM when container ref is available
    if (containerRef.current && !shadowRootRef.current) {
      shadowRootRef.current = containerRef.current.attachShadow({ mode: 'open' });

      // Set initial loading state if no content yet
      if (!htmlContent) {
        shadowRootRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 1.5rem;">
            <div style="text-align: center; color: #6b7280;">
              <p>Generating presentation...</p>
            </div>
          </div>
        `;
      }
    }

    // Update Shadow DOM content when HTML changes
    if (shadowRootRef.current && htmlContent) {
      shadowRootRef.current.innerHTML = htmlContent;
    }
  }, [htmlContent]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto"
      style={{ backgroundColor: 'white' }}
    />
  );
}
