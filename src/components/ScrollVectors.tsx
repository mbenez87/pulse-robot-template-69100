import { motion, useScroll, useTransform } from "framer-motion";

export default function ScrollVectors() {
  const { scrollYProgress } = useScroll();
  const x1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const x2 = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const rot = useTransform(scrollYProgress, [0, 1], [0, 45]);

  return (
    <>
      {/* Soft gradient blob */}
      <motion.div
        style={{ x: x1, y: y1, rotate: rot }}
        className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-30"
      >
        <div className="h-full w-full rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500" />
      </motion.div>

      {/* Dotted ring vector */}
      <motion.svg
        style={{ x: x2, y: y2, rotate: rot }}
        className="pointer-events-none fixed top-1/3 right-[-120px] opacity-40"
        width="420" height="420" viewBox="0 0 420 420" fill="none"
      >
        <defs>
          <radialGradient id="ring" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="210" cy="210" r="180" stroke="url(#ring)" strokeWidth="2" strokeDasharray="2 10"/>
      </motion.svg>

      {/* Subtle diagonal lines */}
      <motion.svg
        style={{ y: y1 }}
        className="pointer-events-none fixed bottom-10 left-10 opacity-20"
        width="360" height="220" viewBox="0 0 360 220" fill="none"
      >
        {[...Array(12)].map((_, i) => (
          <line key={i} x1={i*30} y1="0" x2={i*30+120} y2="220" stroke="white" strokeOpacity="0.6"/>
        ))}
      </motion.svg>
    </>
  );
}