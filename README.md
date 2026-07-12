# Driver Drowsiness Detection using Deep Learning

A real-time driver drowsiness detection system that uses computer vision and deep learning to monitor eye state and trigger an alarm when drowsiness is detected.

## Features

- **Real-time Eye Detection**: Uses OpenCV's Haar cascades to detect face and eyes
- **Deep Learning Classification**: Custom CNN model trained to classify open/closed eyes
- **Drowsiness Score Tracking**: Monitors eye state over time to calculate drowsiness level
- **Audio Alarm**: Triggers an alarm sound when drowsiness is detected
- **Web App**: Browser-based version using MediaPipe for eye state detection

## Tech Stack

- **Programming Language**: Python 3
- **Deep Learning**: TensorFlow / Keras
- **Computer Vision**: OpenCV, MediaPipe
- **Audio**: Pygame (Python), Web Audio API (Web App)
- **Deployment**: Vercel (for web app)

## Project Structure

```
├── detection.py          # Main Python drowsiness detection script
├── Train_model.py        # Script to train the CNN model
├── CNN__model.h5         # Pre-trained Keras model
├── alarm.wav             # Alarm sound file
├── haarcascade/          # Haar cascade XML files for face/eye detection
├── web/                  # Web app files
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── requirements.txt      # Python dependencies
├── vercel.json           # Vercel deployment config
└── package.json          # Project metadata
```

## Installation & Usage (Python App)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ritesh-saini-16/Driver-Drowsiness-Detection.git
   cd Driver-Drowsiness-Detection
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # source .venv/bin/activate  # macOS/Linux
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the detection script**:
   ```bash
   python detection.py
   ```
   - Press `q` in the webcam window to quit

## Web App

The web app uses MediaPipe Face Mesh to detect eye state and calculate drowsiness.

### Local Testing
```bash
cd web
python -m http.server 8000
```
Then open http://localhost:8000 in your browser and click to allow camera access.

### Deployment to Vercel
1. Connect your GitHub repo to Vercel
2. Vercel will automatically deploy the web app from the `web/` directory
3. Your live app will be available at a URL like `https://your-project.vercel.app`

## Model Training

The CNN model was trained on a dataset of ~11,000 eye images (open/closed). To re-train:

1. Organize your dataset into:
   ```
   Train dataset/
     ├── Open/
     └── Closed/
   Valid dataset/
     ├── Open/
     └── Closed/
   ```
2. Run the training script:
   ```bash
   python Train_model.py
   ```

## How It Works

1. **Face & Eye Detection**: Uses Haar cascades to locate the user's face and eyes
2. **Eye State Classification**: The CNN model classifies each eye as open or closed
3. **Drowsiness Score Calculation**: Increments when eyes are closed, decrements when open
4. **Alarm Trigger**: Sounds an alarm when the drowsiness score exceeds a threshold

## License

MIT

