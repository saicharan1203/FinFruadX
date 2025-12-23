import { useEffect } from 'react';

/**
 * Custom hook to add scroll-triggered reveal animations
 * Automatically adds 'revealed' class to elements with scroll-reveal classes
 * when they come into viewport
 */
export const useScrollReveal = () => {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1 // Trigger when 10% of element is visible
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Optional: stop observing after reveal (one-time animation)
          // observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all elements with scroll-reveal classes
    const revealElements = document.querySelectorAll(
      '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right'
    );

    revealElements.forEach(el => observer.observe(el));

    // Cleanup
    return () => {
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, []);
};

/**
 * Hook to add stagger animation to grid children
 */
export const useGridStagger = (containerRef) => {
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.classList.add('grid-stagger');
    }
  }, [containerRef]);
};

/**
 * Hook to add floating animation to elements
 */
export const useFloatingAnimation = (elementRef, delayed = false) => {
  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.classList.add(delayed ? 'float-delayed' : 'float');
    }
  }, [elementRef, delayed]);
};
