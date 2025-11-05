import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';

function FaceDetection() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setShowWebcam(false); // Hide webcam if a file is chosen
  };

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    // Convert base64 to Blob
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => setSelectedFile(new File([blob], "webcam.jpg", {type: "image/jpeg"})));
    setShowWebcam(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return alert('Please select or capture an image');
    const formData = new FormData();
    formData.append('image', selectedFile);
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/detect', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResultImage('data:image/jpeg;base64,' + data.image_with_detections);
      setDetections(data.detections);
    } catch (error) {
      alert('API error');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Face Detection</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={() => setShowWebcam(!showWebcam)}>
        {showWebcam ? "Hide Webcam" : "Use Webcam"}
      </button>
      {showWebcam && (
        <div>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={350}
          />
          <button onClick={capture}>Capture Photo</button>
        </div>
      )}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Detecting...' : 'Detect'}
      </button>
      {resultImage && (
        <div>
          <img src={resultImage} alt="Detected" />
          <pre>{JSON.stringify(detections, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default FaceDetection;
