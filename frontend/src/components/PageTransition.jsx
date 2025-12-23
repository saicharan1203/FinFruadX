import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition Component
 * Provides smooth page transitions when navigating between routes
 * 
 * Animation Styles:
 * - 'fade-slide' (default): Fade in with upward slide
 * - 'fade-scale': Fade in with scale effect
 * - 'slide-left': Slide in from right
 * - 'slide-right': Slide in from left
 * - 'zoom': Zoom in effect
 * - 'flip': 3D flip effect
 */
export const PageTransition = ({
    children,
    animation = 'fade-slide',
    duration = 500
}) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState('enter');

    useEffect(() => {
        if (location !== displayLocation) {
            setTransitionStage('exit');
        }
    }, [location, displayLocation]);

    useEffect(() => {
        if (transitionStage === 'exit') {
            const timer = setTimeout(() => {
                setDisplayLocation(location);
                setTransitionStage('enter');
            }, duration / 2);
            return () => clearTimeout(timer);
        }
    }, [transitionStage, location, duration]);

    const animationClass = `page-transition-${animation}`;
    const stageClass = `transition-${transitionStage}`;

    return (
        <div
            className={`page-transition-wrapper ${animationClass} ${stageClass}`}
            style={{ '--transition-duration': `${duration}ms` }}
        >
            {children}
        </div>
    );
};

/**
 * Simple wrapper that just adds the animation class
 * Use this for basic transitions without route tracking
 */
export const SimplePageTransition = ({ children, className = '' }) => {
    return (
        <div className={`page-transition ${className}`}>
            {children}
        </div>
    );
};
