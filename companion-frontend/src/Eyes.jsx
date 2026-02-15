import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

const Eyes = ({ mood = "idle" }) => {
  const controls = useAnimation();

  // Handle Blinking Logic
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      // Don't blink if we are in a special mood like 'excited' or 'sleeping'
      if (mood === "idle") {
        blink();
      }
    }, 4000); // Blink every 4 seconds

    return () => clearInterval(blinkInterval);
  }, [mood]);

  const blink = async () => {
    await controls.start({ scaleY: 0.1, transition: { duration: 0.1 } });
    await controls.start({ scaleY: 1, transition: { duration: 0.1 } });
  };

  // Define Eye Variants based on Mood
  const pupilVariants = {
    idle: { scale: 1, x: 0, y: 0 },
    excited: { scale: 1.3, y: -5 },
    thinking: { 
      x: [0, 15, -15, 0], 
      y: [0, -5, -5, 0],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } 
    },
    talking: { 
      scale: [1, 1.2, 0.8, 1], 
      transition: { repeat: Infinity, duration: 0.3 } 
    }
  };

  return (
    <div className="face-container">
      <div className="eye-row">
        {/* Left Eye */}
        <motion.div
          className="eye-socket"
          animate={controls}
          initial={{ scaleY: 1 }}
        >
          <motion.div 
            className="pupil"
            animate={mood}
            variants={pupilVariants}
          />
        </motion.div>

        {/* Right Eye */}
        <motion.div
          className="eye-socket"
          animate={controls}
          initial={{ scaleY: 1 }}
        >
          <motion.div 
            className="pupil"
            animate={mood}
            variants={pupilVariants}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Eyes;