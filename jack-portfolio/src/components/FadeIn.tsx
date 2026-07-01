import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  as?: string;
  className?: string;
}

const MotionDiv = motion.create('div');
const MotionNav = motion.create('nav');
const MotionH1 = motion.create('h1');
const MotionP = motion.create('p');
const MotionSection = motion.create('section');
const MotionSpan = motion.create('span');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const motionComponents: Record<string, any> = {
  div: MotionDiv,
  nav: MotionNav,
  h1: MotionH1,
  p: MotionP,
  section: MotionSection,
  span: MotionSpan,
};

export default function FadeIn({
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  as = 'div',
  className = '',
}: FadeInProps) {
  const Component = motionComponents[as] || MotionDiv;

  return (
    <Component
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{
        delay,
        duration,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </Component>
  );
}
