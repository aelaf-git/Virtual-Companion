import React, { useRef, useEffect, useCallback } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { FaceMesh, FACEMESH_TESSELATION } from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import Webcam from "react-webcam";

const GestureManager = ({ onWave, visible }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Gesture State
  const lastX = useRef(0);
  const waveCount = useRef(0);
  const cooldownRef = useRef(false);

  useEffect(() => {
    // --- Initialize Hands ---
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // --- Initialize Face Mesh ---
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const canvasCtx = canvasRef.current.getContext("2d");

    faceMesh.onResults((results) => {
        if (!visible) return; // Don't draw if not visible to save perf
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        canvasCtx.translate(canvasRef.current.width, 0);
        canvasCtx.scale(-1, 1);

        if (results.multiFaceLandmarks) {
          for (const landmarks of results.multiFaceLandmarks) {
            drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, 
                { color: "#38bdf880", lineWidth: 1 }); // Cyan mesh
          }
        }
        canvasCtx.restore();
    });

    hands.onResults((results) => {
      // Logic runs even if hidden! (So Blue can still see you wave)
      
      if (visible) {
          canvasCtx.save();
          canvasCtx.translate(canvasRef.current.width, 0);
          canvasCtx.scale(-1, 1);
      }

      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
           if (visible) {
               drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#4ade80", lineWidth: 2 });
               drawLandmarks(canvasCtx, landmarks, { color: "#f87171", lineWidth: 1, radius: 3 });
           }

           // --- Wave Logic (Always active) ---
           const currentX = landmarks[0].x;
           const movement = Math.abs(currentX - lastX.current);
           if (movement > 0.05) waveCount.current += 1;

           if (waveCount.current > 5 && !cooldownRef.current) { 
             const imageSrc = webcamRef.current ? webcamRef.current.getScreenshot() : null;
             onWave(imageSrc);
             waveCount.current = 0; 
             cooldownRef.current = true;
             setTimeout(() => { cooldownRef.current = false; }, 3000);
           }
           lastX.current = currentX;
        }
      }
      if (visible) canvasCtx.restore();
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
  }, [onWave, visible]);

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