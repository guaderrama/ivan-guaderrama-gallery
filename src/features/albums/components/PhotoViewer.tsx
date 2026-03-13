import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { AlbumPhoto } from '../types';

interface PhotoViewerProps {
  photos: AlbumPhoto[];
  initialIndex: number;
  onClose: () => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ photos, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [showUI, setShowUI] = useState(true);
  const [isAnimatingIn, setIsAnimatingIn] = useState(true);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [dismissY, setDismissY] = useState(0);
  const [dismissOpacity, setDismissOpacity] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Refs for gesture tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchStartRef = useRef<number | null>(null);
  const pinchScaleRef = useRef(1);
  const lastTapRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const translateRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  const photo = photos[currentIndex];

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsAnimatingIn(false));
    });
  }, []);

  // Sync refs with state
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { translateRef.current = translate; }, [translate]);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setSwipeOffset(0);
    setDismissY(0);
    setDismissOpacity(1);
  }, []);

  const goToIndex = useCallback((index: number) => {
    if (index < 0 || index >= photos.length || index === currentIndex) return;
    setIsTransitioning(true);
    setSwipeOffset(index > currentIndex ? -window.innerWidth : window.innerWidth);
    setTimeout(() => {
      setCurrentIndex(index);
      resetView();
      setSwipeOffset(0);
      setIsTransitioning(false);
    }, 250);
  }, [currentIndex, photos.length, resetView]);

  const goNext = useCallback(() => goToIndex(currentIndex + 1), [currentIndex, goToIndex]);
  const goPrev = useCallback(() => goToIndex(currentIndex - 1), [currentIndex, goToIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight': goNext(); break;
        case 'ArrowLeft': goPrev(); break;
        case 'Escape': onClose(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Auto-scroll thumbnail strip to keep current photo visible
  useEffect(() => {
    if (thumbnailStripRef.current) {
      const strip = thumbnailStripRef.current;
      const thumb = strip.children[currentIndex] as HTMLElement;
      if (thumb) {
        const stripRect = strip.getBoundingClientRect();
        const thumbRect = thumb.getBoundingClientRect();
        if (thumbRect.left < stripRect.left || thumbRect.right > stripRect.right) {
          thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }
  }, [currentIndex]);

  // Toggle UI visibility
  const toggleUI = useCallback(() => {
    if (scaleRef.current === 1) setShowUI(prev => !prev);
  }, []);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };

      if (scaleRef.current > 1) {
        isDraggingRef.current = true;
        dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartRef.current = dist;
      pinchScaleRef.current = scaleRef.current;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Pinch to zoom
    if (e.touches.length === 2 && pinchStartRef.current !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(Math.max(pinchScaleRef.current * (dist / pinchStartRef.current), 0.8), 5);
      setScale(newScale);
      if (newScale > 1) setShowUI(false);
      return;
    }

    if (e.touches.length !== 1 || !touchStartRef.current) return;
    const touch = e.touches[0];

    // Pan when zoomed in
    if (scaleRef.current > 1 && isDraggingRef.current && dragStartRef.current) {
      e.preventDefault();
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      setTranslate(prev => ({
        x: prev.x + dx / scaleRef.current,
        y: prev.y + dy / scaleRef.current,
      }));
      return;
    }

    // Swipe between photos (horizontal) or dismiss (vertical)
    if (scaleRef.current === 1) {
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Vertical swipe down to dismiss
      if (dy > 0 && absDy > absDx && absDy > 20) {
        setDismissY(dy * 0.6);
        setDismissOpacity(Math.max(0.3, 1 - dy / 500));
      }
      // Horizontal swipe between photos
      else if (absDx > absDy && absDx > 10) {
        setSwipeOffset(dx);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Pinch end - snap back if below 1
    if (pinchStartRef.current !== null) {
      pinchStartRef.current = null;
      if (scaleRef.current < 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
      if (scaleRef.current <= 1) setShowUI(true);
      return;
    }

    isDraggingRef.current = false;
    dragStartRef.current = null;

    // Dismiss by swipe down
    if (dismissY > 100) {
      onClose();
      return;
    }
    if (dismissY > 0) {
      setDismissY(0);
      setDismissOpacity(1);
    }

    // Horizontal swipe navigation
    if (scaleRef.current === 1 && touchStartRef.current && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > 50 && absDx > absDy * 1.5) {
        const isQuickSwipe = dt < 300 && absDx > 30;
        const isLongSwipe = absDx > window.innerWidth * 0.3;

        if (isQuickSwipe || isLongSwipe) {
          if (dx < 0 && currentIndex < photos.length - 1) { goNext(); }
          else if (dx > 0 && currentIndex > 0) { goPrev(); }
          else { setSwipeOffset(0); }
        } else {
          setSwipeOffset(0);
        }
      } else {
        setSwipeOffset(0);
      }
    } else {
      setSwipeOffset(0);
    }

    touchStartRef.current = null;
  };

  // Double-tap to zoom / Single tap to toggle UI
  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      e.stopPropagation();
      if (scale > 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
        setShowUI(true);
      } else {
        setScale(2.5);
        setShowUI(false);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current === now) {
          toggleUI();
        }
      }, 310);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] select-none touch-none"
      style={{
        backgroundColor: `rgba(0,0,0,${dismissOpacity})`,
        transition: isAnimatingIn ? 'none' : 'background-color 0.2s ease',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
          opacity: showUI ? 1 : 0,
          transform: showUI ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: showUI ? 'auto' : 'none',
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-2 rounded-full text-white/90 hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white/80 text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </span>
        <div className="w-10" />
      </div>

      {/* Image area */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          transform: `translateY(${dismissY}px)`,
          transition: dismissY === 0 && !isAnimatingIn ? 'transform 0.3s ease' : 'none',
        }}
      >
        <div
          style={{
            transform: `translateX(${isTransitioning ? swipeOffset : swipeOffset}px)`,
            transition: isTransitioning || swipeOffset === 0 ? 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)' : 'none',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={photo.url}
            alt={photo.fileName}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
              transition: isDraggingRef.current ? 'none' : 'transform 0.2s ease-out',
              opacity: isAnimatingIn ? 0 : 1,
              willChange: 'transform',
            }}
            draggable={false}
          />
        </div>

        {/* Navigation arrows (desktop) */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:bg-black/50 hover:text-white transition-all"
            style={{
              opacity: showUI ? 1 : 0,
              transition: 'opacity 0.3s ease, background-color 0.2s',
              pointerEvents: showUI ? 'auto' : 'none',
            }}
            aria-label="Anterior"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:bg-black/50 hover:text-white transition-all"
            style={{
              opacity: showUI ? 1 : 0,
              transition: 'opacity 0.3s ease, background-color 0.2s',
              pointerEvents: showUI ? 'auto' : 'none',
            }}
            aria-label="Siguiente"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom thumbnail strip */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 px-2 py-3"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
            opacity: showUI ? 1 : 0,
            transform: showUI ? 'translateY(0)' : 'translateY(100%)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            pointerEvents: showUI ? 'auto' : 'none',
          }}
        >
          <div
            ref={thumbnailStripRef}
            className="flex gap-1.5 justify-center overflow-x-auto scrollbar-hide pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  goToIndex(i);
                }}
                className="flex-shrink-0 rounded-md overflow-hidden transition-all duration-200"
                style={{
                  width: i === currentIndex ? 60 : 48,
                  height: i === currentIndex ? 60 : 48,
                  border: i === currentIndex ? '2px solid white' : '2px solid transparent',
                  opacity: i === currentIndex ? 1 : 0.5,
                }}
              >
                <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoViewer;
