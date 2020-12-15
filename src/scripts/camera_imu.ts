import ROSLIB from "roslib";
import * as THREE from "three";

class CameraIMU {
  ros: ROSLIB.Ros;
  alpha: number | null;
  valpha: number | null;
  z: number | null;
  beta: number | null;
  vbeta: number | null;
  x: number | null;
  gamma: number | null;
  vgamma: number | null;
  y: number | null;
  image_topic: ROSLIB.Topic;
  imu_topic: ROSLIB.Topic;

  constructor(ros_master_ip: string) {
    ros_master_ip = "ws://" + ros_master_ip + ":9090"
    // INITIALIZATION
    this.ros = new ROSLIB.Ros({
      url: ros_master_ip
    });

    this.ros.on('connection', function () { console.log('Connected to websocket server.'); });

    this.ros.on('error', function (error) { console.log('Error connecting to websocket server: ', error); window.alert('Error connecting to websocket server'); });

    this.ros.on('close', function () { console.log('Connection to websocket server closed.'); });

    this.alpha = null;
    this.valpha = null;
    this.z = null;
    this.beta = null;
    this.vbeta = null;
    this.x = null;
    this.gamma = null;
    this.vgamma = null;
    this.y = null;

    this.image_topic = new ROSLIB.Topic({
      ros: this.ros,
      name: "/camera/image/compressed",
      messageType: "sensor_msgs/CompressedImage",
    });

    this.imu_topic = new ROSLIB.Topic({
      ros: this.ros,
      name: "/gyro",
      messageType: "sensor_msgs/Imu",
    });
    
    this.initialize_event_handlers();
  }

  initialize_event_handlers() {
    // setup event handler to capture the orientation event and store the most recent data in a variable

    if (window.DeviceOrientationEvent) {
      // Listen for the deviceorientation event and handle the raw data
      window.addEventListener('deviceorientation', (eventData) => {
        // gamma is the left-to-right tilt in degrees, where right is positive
        this.gamma = eventData.gamma;

        // beta is the front-to-back tilt in degrees, where front is positive
        this.beta = eventData.beta;

        // alpha is the compass direction the device is facing in degrees
        this.alpha = eventData.alpha

      }, false);
    };

    // setup event handler to capture the acceleration event and store the most recent data in a variable

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', (eventData: DeviceMotionEvent) => {
        // Grab the acceleration from the results
        var acceleration = eventData.acceleration;
        this.x = acceleration!.x;
        this.y = acceleration!.y;
        this.z = acceleration!.z;

        // Grab the rotation rate from the results
        var rotation = eventData.rotationRate;
        this.valpha = rotation!.alpha;
        this.vgamma = rotation!.gamma;
        this.vbeta = rotation!.beta;
      }, false);
    } else {
      window.alert("acceleration measurements Not supported.");
    }
  }
  // function that is run by trigger several times a second
  // takes snapshot of video to canvas, encodes the images as base 64 and sends it to the ROS topic
  imageSnapshot(getImageCb: () => string) {
    var imageMessage = new ROSLIB.Message({
      format: "jpeg",
      data: getImageCb().replace("data:image/jpeg;base64,", "")
    });

    this.image_topic.publish(imageMessage);
  }

  imuSnapshot() {
    var beta_radian = ((this.beta! + 360) / 360 * 2 * Math.PI) % (2 * Math.PI);
    var gamma_radian = ((this.gamma! + 360) / 360 * 2 * Math.PI) % (2 * Math.PI);
    var alpha_radian = ((this.alpha! + 360) / 360 * 2 * Math.PI) % (2 * Math.PI);
    var eurlerpose = new THREE.Euler(beta_radian, gamma_radian, alpha_radian);
    var quaternionpose = new THREE.Quaternion;
    quaternionpose.setFromEuler(eurlerpose);

    var imuMessage = new ROSLIB.Message({
      header: {
        frame_id: "world"
      },
      orientation: {
        x: quaternionpose.x,
        y: quaternionpose.y,
        z: quaternionpose.z,
        w: quaternionpose.w
      },
      orientation_covariance: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      angular_velocity: {
        x: this.vbeta,
        y: this.vgamma,
        z: this.valpha,
      },
      angular_velocity_covariance: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      linear_acceleration: {
        x: this.x,
        y: this.y,
        z: this.z,
      },
      linear_acceleration_covariance: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    });

    this.imu_topic.publish(imuMessage);
  }

  start(getImageCb: () => string) {
    setInterval(() => {
      this.imageSnapshot(getImageCb);
    }, 250);       // publish an image 4 times per second
    setInterval(() => {
      this.imuSnapshot();
    }, 100);       // publish an IMU message 10 times per second
  }
}

export default CameraIMU;