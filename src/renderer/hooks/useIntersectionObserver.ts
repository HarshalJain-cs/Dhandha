import { useEffect, useState, useRef, RefObject } from 'react';

/**
 * useIntersectionObserver Hook
 * Detects when an element enters/exits the viewport
 * Useful for lazy loading, infinite scroll, animations
 *
 * @param options - IntersectionObserver options
 * @returns [ref, isIntersecting, entry] tuple
 *
 * @example
 * ```tsx
 * // Lazy load an image
 * const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
 *
 * return (
 *   <div ref={ref}>
 *     {isVisible ? <img src="large-image.jpg" /> : <Skeleton />}
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Infinite scroll
 * const [ref, isVisible] = useIntersectionObserver({ threshold: 1.0 });
 *
 * useEffect(() => {
 *   if (isVisible) {
 *     loadMoreItems();
 *   }
 * }, [isVisible]);
 *
 * return (
 *   <div>
 *     {items.map(item => <ItemCard key={item.id} item={item} />)}
 *     <div ref={ref}>Loading...</div>
 *   </div>
 * );
 * ```
 */
export const useIntersectionObserver = <T extends Element = HTMLDivElement>(
  options?: IntersectionObserverInit
): [RefObject<T>, boolean, IntersectionObserverEntry | null] => {
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Default options
    const defaultOptions: IntersectionObserverInit = {
      threshold: 0,
      root: null,
      rootMargin: '0px',
      ...options,
    };

    // Create observer
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, defaultOptions);

    // Observe element
    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [options?.threshold, options?.root, options?.rootMargin]);

  return [ref, isIntersecting, entry];
};

/**
 * useOnScreen Hook
 * Simplified version that only returns visibility status
 *
 * @param options - IntersectionObserver options
 * @returns [ref, isVisible] tuple
 *
 * @example
 * ```tsx
 * const [ref, isVisible] = useOnScreen({ threshold: 0.5 });
 *
 * return (
 *   <div ref={ref} className={isVisible ? 'fade-in' : 'fade-out'}>
 *     Content
 *   </div>
 * );
 * ```
 */
export const useOnScreen = <T extends Element = HTMLDivElement>(
  options?: IntersectionObserverInit
): [RefObject<T>, boolean] => {
  const [ref, isIntersecting] = useIntersectionObserver<T>(options);
  return [ref, isIntersecting];
};

export default useIntersectionObserver;
