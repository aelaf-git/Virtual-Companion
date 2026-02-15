import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      '@mediapipe/face_mesh': '@mediapipe/face_mesh/face_mesh.js',
      '@mediapipe/hands': '@mediapipe/hands/hands.js',
      '@mediapipe/drawing_utils': '@mediapipe/drawing_utils/drawing_utils.js',
      '@mediapipe/camera_utils': '@mediapipe/camera_utils/camera_utils.js',
    },
  },
})
