import { motion, useScroll, useTransform } from "framer-motion";

export default function ScrollVectors() {
  const { scrollYProgress } = useScroll();
  
  // Respect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Reduced movement for accessibility
  const movementScale = prefersReducedMotion ? 0.2 : 1;
  
  const x1 = useTransform(scrollYProgress, [0, 1], [0, -100 * movementScale]);
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 75 * movementScale]);
  const x2 = useTransform(scrollYProgress, [0, 1], [0, 110 * movementScale]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -80 * movementScale]);
  const rot = useTransform(scrollYProgress, [0, 1], [0, 22.5 * movementScale]);

  return (
    <>
      {/* Soft gradient blob using brand colors */}
      <motion.div
        style={{ x: x1, y: y1, rotate: rot }}
        className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-20"
      >
        <div className="h-full w-full rounded-full bg-gradient-to-tr from-pulse-500 to-pulse-300" />
      </motion.div>

      {/* Dotted ring vector using primary colors */}
      <motion.svg
        style={{ x: x2, y: y2, rotate: rot }}
        className="pointer-events-none fixed top-1/3 right-[-120px] opacity-30"
        width="420" height="420" viewBox="0 0 420 420" fill="none"
      >
        <defs>
          <radialGradient id="ring" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="210" cy="210" r="180" stroke="url(#ring)" strokeWidth="2" strokeDasharray="2 10"/>
      </motion.svg>

      {/* Subtle diagonal lines using muted colors */}
      <motion.svg
        style={{ y: y1 }}
        className="pointer-events-none fixed bottom-10 left-10 opacity-10"
        width="360" height="220" viewBox="0 0 360 220" fill="none"
      >
        {[...Array(12)].map((_, i) => (
          <line key={i} x1={i*30} y1="0" x2={i*30+120} y2="220" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.4"/>
        ))}
      </motion.svg>
    </>
  );
}