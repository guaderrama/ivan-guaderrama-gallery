import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [swipeX, setSwipeX] = useState(0);
  const [dismissY, setDismissY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'none' | 'left' | 'right'>('none');

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const dragLastRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef(0);
  const swipeDirectionRef = useRef<'none' | 'horizontal' | 'vertical'>('none');
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  const photo = photos[currentIndex];

  // Keep scale in ref for touch handlers
  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const resetTransform = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setSwipeX(0);
    setDismissY(0);
    setIsSwiping(false);
    swipeDirectionRef.current = 'none';
  }, []);

  const navigateTo = useCallback((index: number) => {
    if (index < 0 || index >= photos.length || index === currentIndex) return;
    setSlideDirection(index > currentIndex ? 'left' : 'right');
    setTimeout(() => {
      setCurrentIndex(index);
      resetTransform();
      setSlideDirection('none');
    }, 200);
  }, [currentIndex, photos.length, resetTransform]);

  const goNext = useCallback(() => navigateTo(currentIndex + 1), [currentIndex, navigateTo]);
  const goPrev = useCallback(() => navigateTo(currentIndex - 1), [currentIndex, navigateTo]);

  // Keyboard navigation (PC)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Auto-scroll thumbnails
  useEffect(() => {
    const strip = thumbnailStripRef.current;
    if (!strip) return;
    const thumb = strip.children[currentIndex] as HTMLElement | undefined;
    if (thumb) {
      thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentIndex]);

  // ===== TOUCH HANDLERS (mobile + iPad) =====
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      swipeDirectionRef.current = 'none';
      setIsSwiping(true);

      if (scaleRef.current > 1) {
        isDraggingRef.current = true;
        dragLastRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = scaleRef.current;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Pinch zoom
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(Math.max(pinchStartScaleRef.current * (dist / pinchStartDistRef.current), 0.8), 5);
      setScale(newScale);
      if (newScale > 1) setShowUI(false);
      return;
    }

    if (e.touches.length !== 1 || !touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    // Pan when zoomed
    if (scaleRef.current > 1 && isDraggingRef.current && dragLastRef.current) {
      const moveDx = touch.clientX - dragLastRef.current.x;
      const moveDy = touch.clientY - dragLastRef.current.y;
      dragLastRef.current = { x: touch.clientX, y: touch.clientY };
      setTranslate(prev => ({
        x: prev.x + moveDx / scaleRef.current,
        y: prev.y + moveDy / scaleRef.current,
      }));
      return;
    }

    // Determine swipe direction (lock after 10px movement)
    if (swipeDirectionRef.current === 'none' && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      swipeDirectionRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }

    if (swipeDirectionRef.current === 'horizontal') {
      setSwipeX(dx);
    } else if (swipeDirectionRef.current === 'vertical' && dy > 0) {
      setDismissY(dy * 0.5);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsSwiping(false);

    // Pinch end
    if (pinchStartDistRef.current !== null) {
      pinchStartDistRef.current = null;
      if (scaleRef.current < 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
      if (scaleRef.current <= 1) setShowUI(true);
      return;
    }

    isDraggingRef.current = false;
    dragLastRef.current = null;

    // Dismiss
    if (dismissY > 80) {
      onClose();
      return;
    }
    setDismissY(0);

    // Swipe navigation
    if (touchStartRef.current && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dt = Date.now() - touchStartRef.current.time;
      const absDx = Math.abs(dx);

      const isQuickSwipe = dt < 300 && absDx > 40;
      const isLongSwipe = absDx > window.innerWidth * 0.25;

      if (swipeDirectionRef.current === 'horizontal' && (isQuickSwipe || isLongSwipe)) {
        if (dx < 0 && currentIndex < photos.length - 1) { goNext(); return; }
        if (dx > 0 && currentIndex > 0) { goPrev(); return; }
      }
    }

    setSwipeX(0);
    swipeDirectionRef.current = 'none';
    touchStartRef.current = null;
  }, [dismissY, currentIndex, photos.length, goNext, goPrev, onClose]);

  // ===== MOUSE HANDLERS (PC) =====
  const handleMouseWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.3 : 0.3;
      setScale(prev => {
        const next = Math.min(Math.max(prev + delta, 1), 5);
        if (next === 1) {
          setTranslate({ x: 0, y: 0 });
          setShowUI(true);
        } else {
          setShowUI(false);
        }
        return next;
      });
    }
  }, []);

  // Click handler: single tap = toggle UI, double tap/click = zoom
  const handleClick = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300) {
      // Double click/tap
      lastTapTimeRef.current = 0;
      if (scale > 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
        setShowUI(true);
      } else {
        setScale(2.5);
        setShowUI(false);
      }
    } else {
      lastTapTimeRef.current = now;
      setTimeout(() => {
        if (lastTapTimeRef.current === now) {
          if (scaleRef.current === 1) setShowUI(p => !p);
        }
      }, 320);
    }
  }, [scale]);

  // Background click to close (clicking dark area)
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Slide animation class
  const getSlideTransform = () => {
    if (slideDirection === 'left') return 'translateX(-100%)';
    if (slideDirection === 'right') return 'translateX(100%)';
    if (isSwiping && swipeX !== 0) return `translateX(${swipeX}px)`;
    return 'translateX(0)';
  };

  const bgOpacity = dismissY > 0 ? Math.max(0.3, 1 - dismissY / 300) : 1;

  const viewer = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: `rgba(0,0,0,${bgOpacity})`,
        transition: isSwiping ? 'none' : 'background-color 0.3s ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleMouseWheel}
      onClick={handleClick}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          opacity: showUI ? 1 : 0,
          transform: showUI ? 'translateY(0)' : 'translateY(-60px)',
          transition: 'opacity 0.3s, transform 0.3s',
          pointerEvents: showUI ? 'auto' : 'none',
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
          }}
          aria-label="Cerrar"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600 }}>
          {currentIndex + 1} / {photos.length}
        </span>
        <div style={{ width: 40 }} />
      </div>

      {/* Main image area */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transform: `translateY(${dismissY}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: getSlideTransform(),
            transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          <img
            src={photo.url}
            alt={photo.fileName}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
              transition: isDraggingRef.current ? 'none' : 'transform 0.2s ease-out',
              willChange: 'transform',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Left arrow (PC/tablet) */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            color: 'rgba(255,255,255,0.85)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: showUI ? 1 : 0,
            transition: 'opacity 0.3s, background 0.2s',
            pointerEvents: showUI ? 'auto' : 'none',
            zIndex: 5,
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(0,0,0,0.6)'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'rgba(0,0,0,0.4)'; }}
          aria-label="Anterior"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right arrow (PC/tablet) */}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            color: 'rgba(255,255,255,0.85)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: showUI ? 1 : 0,
            transition: 'opacity 0.3s, background 0.2s',
            pointerEvents: showUI ? 'auto' : 'none',
            zIndex: 5,
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(0,0,0,0.6)'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'rgba(0,0,0,0.4)'; }}
          aria-label="Siguiente"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            padding: '12px 8px',
            paddingBottom: 16,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            opacity: showUI ? 1 : 0,
            transform: showUI ? 'translateY(0)' : 'translateY(80px)',
            transition: 'opacity 0.3s, transform 0.3s',
            pointerEvents: showUI ? 'auto' : 'none',
          }}
        >
          <div
            ref={thumbnailStripRef}
            style={{
              display: 'flex',
              gap: 6,
              justifyContent: 'center',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingBottom: 4,
            }}
          >
            {photos.map((p, i) => {
              const isActive = i === currentIndex;
              return (
                <button
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo(i);
                  }}
                  style={{
                    flexShrink: 0,
                    width: isActive ? 60 : 48,
                    height: isActive ? 60 : 48,
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: isActive ? '2px solid white' : '2px solid transparent',
                    opacity: isActive ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                    padding: 0,
                    cursor: 'pointer',
                    background: 'none',
                  }}
                >
                  <img
                    src={p.url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(viewer, document.body);
};

export default PhotoViewer;
