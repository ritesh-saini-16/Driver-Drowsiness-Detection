// DOM Elements
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const eyeStateSpan = document.getElementById('eyeState');
const scoreSpan = document.getElementById('score');
const alarmStatusSpan = document.getElementById('alarmStatus');

// Alarm setup (we'll use a simple beep for web compatibility)
let audioContext;
let oscillator;
let gainNode;
let alarmOn = false;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function startAlarm() {
    if (!audioContext) initAudio();
    if (alarmOn) return;
    
    alarmOn = true;
    alarmStatusSpan.textContent = 'Alarm: ON';
    alarmStatusSpan.classList.add('on');
    
    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    gainNode.gain.value = 0.3;
    oscillator.start();
}

function stopAlarm() {
    if (!alarmOn) return;
    
    alarmOn = false;
    alarmStatusSpan.textContent = 'Alarm: OFF';
    alarmStatusSpan.classList.remove('on');
    
    if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
    }
    if (gainNode) {
        gainNode.disconnect();
    }
}

// Eye Aspect Ratio (EAR) Calculation
function calculateEAR(landmarks, eyeIndices) {
    // Get the eye landmarks
    const p1 = landmarks[eyeIndices[0]];
    const p2 = landmarks[eyeIndices[1]];
    const p3 = landmarks[eyeIndices[2]];
    const p4 = landmarks[eyeIndices[3]];
    const p5 = landmarks[eyeIndices[4]];
    const p6 = landmarks[eyeIndices[5]];
    
    // Calculate distances
    const vertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
    const vertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
    const horizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y);
    
    // EAR formula
    return (vertical1 + vertical2) / (2.0 * horizontal);
}

// MediaPipe Face Mesh Setup
const faceMesh = new FaceMesh({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// Eye landmark indices from MediaPipe Face Mesh
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];
const EAR_THRESHOLD = 0.25; // Adjust this based on testing
const SCORE_INC_CLOSED = 2;
const SCORE_DEC_OPEN = 1;
const ALARM_THRESHOLD = 20;
let drowsinessScore = 0;

// Results callback
faceMesh.onResults((results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw the video frame
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            // Calculate EAR for both eyes
            const leftEAR = calculateEAR(landmarks, LEFT_EYE_INDICES);
            const rightEAR = calculateEAR(landmarks, RIGHT_EYE_INDICES);
            const avgEAR = (leftEAR + rightEAR) / 2.0;
            
            // Update drowsiness score
            if (avgEAR < EAR_THRESHOLD) {
                drowsinessScore = Math.min(drowsinessScore + SCORE_INC_CLOSED, 100);
                eyeStateSpan.textContent = 'CLOSED';
                eyeStateSpan.style.color = '#e74c3c';
            } else {
                drowsinessScore = Math.max(drowsinessScore - SCORE_DEC_OPEN, 0);
                eyeStateSpan.textContent = 'OPEN';
                eyeStateSpan.style.color = '#27ae60';
            }
            
            // Update score display
            scoreSpan.textContent = drowsinessScore;
            
            // Alarm logic
            if (drowsinessScore >= ALARM_THRESHOLD) {
                startAlarm();
                // Draw red border when alarm is on
                canvasCtx.strokeStyle = '#e74c3c';
                canvasCtx.lineWidth = 10;
                canvasCtx.strokeRect(0, 0, canvasElement.width, canvasElement.height);
            } else {
                stopAlarm();
            }
            
            // Optional: Draw face mesh
            drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
            drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#30FF30' });
            drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#30FF30' });
        }
    } else {
        // No face detected
        eyeStateSpan.textContent = 'No Face';
        eyeStateSpan.style.color = '#f39c12';
        drowsinessScore = Math.max(drowsinessScore - 1, 0);
        scoreSpan.textContent = drowsinessScore;
        stopAlarm();
    }
    
    canvasCtx.restore();
});

// Camera setup
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

// Set canvas size when video is ready
videoElement.addEventListener('loadedmetadata', () => {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
});

// Start camera when user interacts (required for audio context)
document.body.addEventListener('click', () => {
    if (camera && !camera.isStarted) {
        camera.start();
    }
}, { once: true });
