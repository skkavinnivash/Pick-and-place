# Memory Master – 60-Second Blitz Memory Arena 🧠🖐️

An interactive memory puzzle game with real-time **AI Webcam Hand-Tracking Gestures** powered by MediaPipe Hands.

---

## 🚀 Quick Start (All-in-One Launcher)

You can launch the game and the hand tracking webcam simultaneously with a single command:

### Option 1: Python Module (Recommended)
```bash
python launch.py
```
This single script:
1. Verifies Node.js & npm environment
2. Automatically installs packages if needed
3. Launches the Vite development server
4. Opens your default browser directly at `http://localhost:5173/?autoCamera=1`
5. Automatically requests camera permission and activates real-time hand tracking
6. Press `Ctrl + C` in the terminal to cleanly terminate the server

---

### Option 2: Windows Batch File
Double-click [launch.bat](file:///launch.bat) or run from terminal:
```cmd
launch.bat
```
*(Automatically detects Python to run `launch.py`, or starts the dev server directly)*

---

### Option 3: Offline Standalone HTML
If you want to play without running a local dev server:
Double-click [Memory-Master.html](file:///Memory-Master.html) to open directly in Google Chrome / Edge.

---

## 🖐️ Hand Tracking Gestures Guide

| Action | Hand Gesture | Description |
| :--- | :--- | :--- |
| **Move Cursor** | 🖐️ **Open Palm / Index Pointer** | Point your hand at the webcam; the glowing neon pointer tracks your index fingertip. |
| **Pick Up / Select** | 🤏 **Pinch Gesture** | Touch your **Thumb Tip** and **Index Tip** together to grab cards or click buttons. |
| **Place / Drop** | 🖐️ **Release Pinch** | Separate your thumb and index fingers to release the object into a numbered slot. |
| **Alternative** | 🖱️ **Mouse / Touch** | You can always use normal mouse click and drag at any time. |

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Vanilla Modern CSS (Glassmorphism & animations)
- **Computer Vision**: Google MediaPipe Hands (`@mediapipe/camera_utils`, `@mediapipe/hands`)
- **Audio**: Web Audio API Sound FX
- **Launcher**: Python 3 (`launch.py`) with cross-platform socket loopback & process tree management
