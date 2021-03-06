import { useRef, useState } from "react";
import Webcam from "react-webcam";
import CameraIMU from "./scripts/camera_imu.ts";

function App() {
  const [rosMasterIp, setRosMasterIp] = useState(
    window.localStorage.getItem('rosMasterIp') | ""
  );
  const [frontFacing, setFrontFacing] = useState(
    window.localStorage.getItem('frontFacing') | false
  );
  window.localStorage.setItem("frontFacing", frontFacing);

  var camera_imu;
  const padding = 10;
  const width = window.screen.width - 2 * padding;
  const height = window.screen.height * 0.65;
  const outputDims = { width: 1920, height: 1080 };

  var videoConstraints = {
    width: width,
    height: height,
    facingMode: frontFacing ? "user" : { exact: "environment" },
  };

  const onRosIpChange = (event) => {
    window.localStorage.setItem("rosMasterIp", event.target.value);
    console.log(event.target.value);
    setRosMasterIp(event.target.value);
  };

  const onCameraDirChange = () => {
    window.localStorage.setItem("frontFacing", !frontFacing);
    setFrontFacing(!frontFacing);
  };

  const webcamRef = useRef(null);

  const getImageCb = () => {
    if (webcamRef) {
      const screenshot = webcamRef.current.getScreenshot(outputDims);
      if (screenshot)
      {
        return screenshot;
      }
      else {
        window.alert(`Camera not accessible!`);
      }
    }
  };

  const initCameraIMU = () => {
    try {
      camera_imu = new CameraIMU(rosMasterIp);
      camera_imu.start(getImageCb);
    } catch (error) {
      window.alert(`An error has occured: ${error}`);
    }
  };

  return (
    <div style={{ padding: `${padding}px` }}>
      <label>ROS Master IP Address:</label>
      <input onChange={onRosIpChange} value={rosMasterIp}/>
      <br />
      <br />
      <button onClick={() => initCameraIMU()}>Initialize</button>
      <br />
      <br />
      <label>Front Facing Camera? </label>
      <input onChange={onCameraDirChange} value={frontFacing} type="checkbox" />
      <div>
        
      </div>
      <Webcam
        audio={false}
        height={height}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={width}
        videoConstraints={videoConstraints}
      />
    </div>
  );
}

export default App;
