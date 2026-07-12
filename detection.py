import cv2
import os
from keras.models import load_model
import numpy as np
from pygame import mixer

# Initialize mixer
mixer.init()
sound = mixer.Sound('alarm.wav')

# Load Haar cascades
face = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt.xml')
leye = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_lefteye_2splits.xml')
reye = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_righteye_2splits.xml')

# Load model
model = load_model('CNN__model.h5')

# Camera setup
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FPS, 60)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Create window and bring to front
cv2.namedWindow('Driver Drowsiness Detection', cv2.WINDOW_NORMAL)
cv2.setWindowProperty('Driver Drowsiness Detection', cv2.WND_PROP_TOPMOST, 1)

# Parameters
SCORE_INC_CLOSED = 3
SCORE_DEC_OPEN = 2
ALARM_THRESHOLD = 35

font = cv2.FONT_HERSHEY_COMPLEX_SMALL
score = 0
thicc = 2
path = os.getcwd()

while True:
    ret, frame = cap.read()
    height, width = frame.shape[:2]
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect eyes once per frame
    left_eye = leye.detectMultiScale(gray)
    right_eye = reye.detectMultiScale(gray)

    rpred = [1]  # default open
    lpred = [1]

    # Process right eye
    for (x, y, w, h) in right_eye[:1]:  # only first detection
        r_eye = frame[y:y + h, x:x + w]
        r_eye = cv2.cvtColor(r_eye, cv2.COLOR_BGR2GRAY)
        r_eye = cv2.resize(r_eye, (100, 100)) / 255.0
        r_eye = np.expand_dims(r_eye.reshape(100, 100, 1), axis=0)
        rpred = (model.predict(r_eye) >= 0.5).astype(int)
        break

    # Process left eye
    for (x, y, w, h) in left_eye[:1]:  # only first detection
        l_eye = frame[y:y + h, x:x + w]
        l_eye = cv2.cvtColor(l_eye, cv2.COLOR_BGR2GRAY)
        l_eye = cv2.resize(l_eye, (100, 100)) / 255.0
        l_eye = np.expand_dims(l_eye.reshape(100, 100, 1), axis=0)
        lpred = (model.predict(l_eye) >= 0.5).astype(int)
        break

    # ====== SCORE UPDATE (One per frame) ======
    if (rpred[0] == 0 and lpred[0] == 0):  # both eyes closed
        score = min(score + SCORE_INC_CLOSED, 100)
        cv2.putText(frame, "Closed", (10, height - 20), font, 1, (255, 255, 255), 1, cv2.LINE_AA)
    else:
        score = max(score - SCORE_DEC_OPEN, 0)
        cv2.putText(frame, "Open", (10, height - 20), font, 1, (255, 255, 255), 1, cv2.LINE_AA)

    # ====== DISPLAY AND ALARM ======
    cv2.rectangle(frame, (0, height - 50), (200, height), (0, 0, 0), thickness=cv2.FILLED)
    cv2.putText(frame, f"Closed Score: {score}", (10, height - 20), font, 1, (255, 255, 255), 1, cv2.LINE_AA)

    # Alarm control
    if score >= ALARM_THRESHOLD:
        if not mixer.get_busy():
            sound.play()
        thicc = thicc + 2 if thicc < 16 else 2
        cv2.rectangle(frame, (0, 0), (width, height), (0, 0, 255), thicc)
    else:
        sound.stop()

    cv2.imshow('Driver Drowsiness Detection', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
