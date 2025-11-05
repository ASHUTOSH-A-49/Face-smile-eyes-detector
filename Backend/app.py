from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64

app = Flask(__name__)
CORS(app)

face_cascade = cv2.CascadeClassifier('cascades/haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier('cascades/haarcascade_eye.xml')
smile_cascade = cv2.CascadeClassifier('cascades/haarcascade_smile.xml')

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Read image bytes and convert to OpenCV format
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    detections = []
    
    for (x, y, w, h) in faces:
        #face detection
        cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)

        roi_gray = gray[y:y+h, x:x+w]
        # eye and smile detection 
        eyes = eye_cascade.detectMultiScale(roi_gray, 1.1, 8)
        smiles = smile_cascade.detectMultiScale(roi_gray, 1.4, 10)

        detection = {
            'face': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
            'eyes_detected': len(eyes) > 0,
            'smile_detected': len(smiles) > 0
        }
        detections.append(detection)
    
    # Convert output image with rectangles to base64
    _, buffer = cv2.imencode('.jpg', img)
    img_encoded = base64.b64encode(buffer).decode('utf-8')

    return jsonify({
        'detections': detections,
        'image_with_detections': img_encoded
    })

if __name__ == '__main__':
    app.run(debug=True)
