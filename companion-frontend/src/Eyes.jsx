import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

const Eyes = ({ mood = "idle" }) => {
  const blinkControls = useAnimation();
  const pupilControls = useAnimation();
  
  // State to track if we are currently looking around (to avoid conflicts)
  const [lookingAround, setLookingAround] = useState(false);

  // --- 1. RANDOM BLINKING ---
  useEffect(() => {
    let timeoutId;
    const triggerBlink = () => {
      // Blink duration
      const duration = 0.15;
      blinkControls.start({ scaleY: 0.1, transition: { duration: duration } })
        .then(() => blinkControls.start({ scaleY: 1, transition: { duration: duration } }));

      // Plan next blink (random between 2s and 6s)
      const nextBlink = 2000 + Math.random() * 4000;
      timeoutId = setTimeout(triggerBlink, nextBlink);
    };

    // Initial blink
    timeoutId = setTimeout(triggerBlink, 2000);

    return () => clearTimeout(timeoutId);
  }, [blinkControls]);


  // --- 2. IDLE SACCADES (Looking Around) ---
  useEffect(() => {
    let intervalId;

    if (mood === "idle") {
      const triggerSaccade = async () => {
        setLookingAround(true);
        // Random X and Y offsets (constrained to keep pupil inside)
        const x = (Math.random() - 0.5) * 30; // -15 to +15
        const y = (Math.random() - 0.5) * 20; // -10 to +10
        
        await pupilControls.start({ 
          x, 
          y, 
          transition: { duration: 0.2, ease: "easeOut" } 
        });
        
        // Hold the gaze for a random time (0.5s - 2s), then maybe move again or return
        setLookingAround(false);
      };

      // Try to look around every 2-5 seconds
      intervalId = setInterval(() => {
        if (Math.random() > 0.3) { // 70% chance to move eyes
          triggerSaccade();
        } else {
            // 30% chance to return to center
             pupilControls.start({ x: 0, y: 0, transition: { duration: 0.3 } });
        }
      }, 2500);
    } else {
        // If not idle, reset manual control so variants can take over
        pupilControls.stop();
    }

    return () => clearInterval(intervalId);
  }, [mood, pupilControls]);


  // --- 3. MOOD VARIANTS ---
  const pupilVariants = {
    idle: { scale: 1 }, // Position handled by controls
    excited: { 
      scale: 1.1, 
      y: [0, -10, 0, -5, 0], // Happy bounce
      transition: { repeat: Infinity, duration: 0.8, ease: "easeInOut" } 
    },
    thinking: { 
      x: [0, 15, -15, 0], 
      y: [0, -10, 10, 0],
      scale: 1,
      transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } 
    },
    talking: { 
      scale: [1, 1.2, 0.9, 1], 
      transition: { repeat: Infinity, duration: 0.3 } 
    },
    happy: {
        scaleY: [1, 1.5, 1], // Squinting/smiling eyes
        scaleX: [1, 1.2, 1],
    },
    sad: {
        y: 10,
        scale: 0.9
    }
  };

  return (
    <div className={`face-container ${mood}`}>
      <div className="eye-row">
        {/* Left Eye Socket (Blinking) */}
        <motion.div
          className={`eye-socket ${mood}`}
          animate={blinkControls}
          initial={{ scaleY: 1 }}
        >
          {/* Left Pupil (Movement & Mood) */}
          <motion.div 
            className={`pupil ${mood}`}
            // We alternate between mood-based animation and random-idle animation
            animate={mood === "idle" ? pupilControls : mood}
            variants={pupilVariants}
          />
        </motion.div>

        {/* Right Eye Socket (Blinking) */}
        <motion.div
          className={`eye-socket ${mood}`}
          animate={blinkControls}
          initial={{ scaleY: 1 }}
        >
          {/* Right Pupil (Movement & Mood) */}
          <motion.div 
            className={`pupil ${mood}`}
            animate={mood === "idle" ? pupilControls : mood}
            variants={pupilVariants}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Eyes;