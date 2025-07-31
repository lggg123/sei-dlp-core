import { forwardRef } from 'react';
import styles from './Text.module.css';

interface HoloTextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'holo' | 'primary-glow' | 'secondary-glow' | 'accent-glow' | 'cyan-glow' | 'purple-glow' | 'pink-glow' | 'hero-animated' | 'hero-glow';
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
}

const HoloText = forwardRef<HTMLElement, HoloTextProps>(
  ({ variant = 'holo', as: Component = 'span', className = '', children, ...props }, ref) => {
    const getVariantClass = () => {
      switch (variant) {
        case 'primary-glow': return styles.primaryGlow;
        case 'secondary-glow': return styles.secondaryGlow;
        case 'accent-glow': return styles.accentGlow;
        case 'cyan-glow': return styles.cyanGlow;
        case 'purple-glow': return styles.purpleGlow;
        case 'pink-glow': return styles.pinkGlow;
        case 'hero-animated': return styles.heroAnimated;
        case 'hero-glow': return styles.heroGlow;
        default: return styles.holo;
      }
    };

    return (
      <Component
        ref={ref}
        className={`${getVariantClass()} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

HoloText.displayName = 'HoloText';

export default HoloText;