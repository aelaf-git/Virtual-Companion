import React, { useRef, useEffect, useCallback } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { FaceMesh, FACEMESH_TESSELATION } from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import Webcam from "react-webcam";

const GestureManager = ({ onWave, onNumberDetected, visible }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Gesture State
  const lastX = useRef(0);
  const waveCount = useRef(0);
  const waveCooldownRef = useRef(false);

  // Finger Counting State
  const lastFingerCount = useRef(0);
  const countStability = useRef(0);
  const detectionCooldown = useRef(false);

  // Result storage to prevent flickering and coordinate drawing
  const faceResultsRef = useRef(null);
  const handResultsRef = useRef(null);

  useEffect(() => {
    // --- Finger Counting Logic ---
    const countFingers = (landmarks) => {
      let count = 0;
      const palmX = (landmarks[0].x + landmarks[9].x) / 2;
      const palmY = (landmarks[0].y + landmarks[9].y) / 2;
      const dist = (p1, p2x, p2y) => Math.sqrt(Math.pow(p1.x - p2x, 2) + Math.pow(p1.y - p2y, 2));

      if (dist(landmarks[4], palmX, palmY) > dist(landmarks[2], palmX, palmY)) count++;

      const fingerTips = [8, 12, 16, 20];
      const fingerPips = [6, 10, 14, 18];
      for (let i = 0; i < 4; i++) {
        if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) count++;
      }
      return count;
    };

    const drawAll = () => {
      if (!visible || !canvasRef.current) return;
      const canvasCtx = canvasRef.current.getContext("2d");
      
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Mirror the context to match the CSS-mirrored video
      canvasCtx.translate(canvasRef.current.width, 0);
      canvasCtx.scale(-1, 1);

      // Draw Face Mesh
      if (faceResultsRef.current?.multiFaceLandmarks) {
        for (const landmarks of faceResultsRef.current.multiFaceLandmarks) {
          drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: "#38bdf880", lineWidth: 1 });
        }
      }

      // Draw Hands
      if (handResultsRef.current?.multiHandLandmarks) {
        for (const landmarks of handResultsRef.current.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#4ade80", lineWidth: 2 });
          drawLandmarks(canvasCtx, landmarks, { color: "#f87171", lineWidth: 1, radius: 3 });
        }
      }
      canvasCtx.restore();
    };

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
        faceResultsRef.current = results;
        drawAll();
    });

    hands.onResults((results) => {
      handResultsRef.current = results;
      drawAll();

      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
           // --- Number Detection Logic ---
           const currentCount = countFingers(landmarks);
           if (currentCount === lastFingerCount.current && currentCount > 0) {
             countStability.current += 1;
           } else {
             countStability.current = 0;
           }
           lastFingerCount.current = currentCount;

           if (countStability.current > 15 && !detectionCooldown.current) {
             const imageSrc = webcamRef.current ? webcamRef.current.getScreenshot() : null;
             onNumberDetected(currentCount, imageSrc);
             countStability.current = 0;
             detectionCooldown.current = true;
             setTimeout(() => { detectionCooldown.current = false; }, 4000);
           }

           // --- Wave Logic (Always active) ---
           const currentX = landmarks[0].x;
           const movement = Math.abs(currentX - lastX.current);
           if (movement > 0.05) waveCount.current += 1;

           if (waveCount.current > 5 && !waveCooldownRef.current) { 
             const imageSrc = webcamRef.current ? webcamRef.current.getScreenshot() : null;
             onWave(imageSrc);
             waveCount.current = 0; 
             waveCooldownRef.current = true;
             setTimeout(() => { waveCooldownRef.current = false; }, 3000);
           }
           lastX.current = currentX;
        }
      }
    });

    if (webcamRef.current && webcamRef.current.video) {
        const camera = new cam.Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (webcamRef.current && webcamRef.current.video) {
                await faceMesh.send({ image: webcamRef.current.video });
                await hands.send({ image: webcamRef.current.video });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
    }
  }, [onWave, onNumberDetected, visible]);

  return (
    <div className={`camera-preview ${visible ? 'visible' : ''}`}>
      <Webcam 
        ref={webcamRef} 
        mirrored={true}
        screenshotFormat="image/jpeg"
        style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover"
        }}
      />
      <canvas 
        ref={canvasRef}
        width={640}
        height={480}
        style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 10
        }}
      />
    </div>
  );
};

export default GestureManager;