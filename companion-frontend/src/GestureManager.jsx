import React, { useRef, useEffect, useCallback } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { FaceMesh, FACEMESH_TESSELATION } from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import Webcam from "react-webcam";

const GestureManager = ({ onWave }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Gesture State
  const lastX = useRef(0);
  const waveCount = useRef(0);
  const cooldownRef = useRef(false);

  const capture = useCallback(() => {
    if (webcamRef.current) {
        return webcamRef.current.getScreenshot();
    }
    return null;
  }, [webcamRef]);

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

    // --- Results Handling ---
    // We need to coordinate drawing because we have two async results coming in.
    // Actually, drawing getting overwritten is a risk if we clear canvas in both.
    // Better approach: We can't easily synchronize exact frames for both output without a complex loop.
    // BUT, simple approach:
    // Hands.onResults -> Draw Hands
    // Face.onResults -> Draw Face
    // We just need to NOT clear the canvas in one of them if we want to layer? 
    // Or we clear in the camera loop?
    // Camera loop runs -> send to hands -> send to face.
    // The callbacks happen whenever.
    // Let's try: Clear canvas at start of `onFrame`? No, we don't control `onFrame` timing vs results timing perfectly.
    // 
    // Standard MediaPipe pattern: Use the `onResults` to draw on top of the image.
    // If we want both, maybe we should use `Holistic`? 
    // But since we want to match the user's script (separate), let's try to manage it.
    // 
    // Let's use a shared state or just accept some flickering/overdraw. 
    // Actually, `canvas` context is persistent. We can clear it in the `onFrame` loop before sending?
    // No, `camera_utils` abstracts the loop.
    // 
    // Let's Clear in `FaceMesh` results and draw Face, then `Hands` draws Hands on top?
    // This relies on order.
    // Let's try to just Clear in FaceMesh results (assuming it runs every frame). 
    // If Hands runs faster/slower, it might be weird.
    //
    // Alternative: Just use the `camera` instance to drive a single update loop if possible.
    //
    // Let's stick to the simplest robust way: Just one `onResults` that handles everything? No, they are separate instances.
    // 
    // Okay, for this implementation, giving the user what they asked for (Face + Hands tracking), 
    // we will rely on FaceMesh to clear the canvas, as it's the "background" mesh.
    
    const canvasCtx = canvasRef.current.getContext("2d");

    faceMesh.onResults((results) => {
        // 1. Draw Video Frame (Background)
        // We actually mirror it here to match the webcam mirror
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // If we want to draw the video feed on the canvas, we can.
        // But we have the Webcam component behind it. We just want to draw overlay.
        // So we just clearRect.
        
        canvasCtx.translate(canvasRef.current.width, 0);
        canvasCtx.scale(-1, 1);

        // 2. Draw Face
        if (results.multiFaceLandmarks) {
          for (const landmarks of results.multiFaceLandmarks) {
            drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, 
                { color: "#C0C0C070", lineWidth: 1 });
            // Draw some key points?
            // drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 1, radius: 1 });
          }
        }
        canvasCtx.restore();
    });

    hands.onResults((results) => {
      // We do NOT clear rect here, so we draw ON TOP of face (if face drew first).
      // If Face didn't draw, we might have trails. 
      // Ideally we sync. 
      // For now, let's assume close enough timing.
      
      canvasCtx.save();
      // Mirror for hands too
      canvasCtx.translate(canvasRef.current.width, 0);
      canvasCtx.scale(-1, 1);

      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
           // Visualization
           drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, 
               { color: "#00FF00", lineWidth: 2 });
           drawLandmarks(canvasCtx, landmarks, 
               { color: "#FF0000", lineWidth: 1, radius: 3 });

           // --- Wave Logic ---
           const currentX = landmarks[0].x;
           const movement = Math.abs(currentX - lastX.current);

           if (movement > 0.05) { 
             waveCount.current += 1;
           }

           if (waveCount.current > 5 && !cooldownRef.current) { 
             console.log("Wave Detected!");
             const imageSrc = webcamRef.current ? webcamRef.current.getScreenshot() : null;
             onWave(imageSrc);
             waveCount.current = 0; 
             cooldownRef.current = true;
             setTimeout(() => { cooldownRef.current = false; }, 3000);
           }
           lastX.current = currentX;
        }
      }
      canvasCtx.restore();
    });

    // --- Camera Loop ---
    if (webcamRef.current && webcamRef.current.video) {
        const camera = new cam.Camera(webcamRef.current.video, {
          onFrame: async () => {
            // Send to both
            // We await sequentially to be safe
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
  }, [onWave]);

  return (
    <div className="camera-preview">
       {/* Webcam hidden? No, we want to see it, and draw on top */}
       {/* Actually, if we draw the video on canvas, we can hide webcam. 
           But CameraUtils needs the video element source. 
           So we keep Webcam visible, and place canvas absolutely on top. */}
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