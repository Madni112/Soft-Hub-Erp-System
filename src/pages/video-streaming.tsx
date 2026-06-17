import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { axiosService } from '../service/axois';

const VideoStreaming = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = 'http://localhost:8080/streamings/hls/stream.m3u8';

  // Function to make the API call on component mount
  const startStreaming = async () => {
    axiosService.get('/stream');
  };

  // Function to make the API call on component unmount
  const stopStreaming = async () => {
    axiosService.post('/stream');
  };

  useEffect(() => {
    // Start streaming when the component is mounted
    startStreaming();

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl); // Load the .m3u8 stream
      hls.attachMedia(videoRef.current!); // Attach to video element

      // Clean up Hls.js instance and stop streaming on component unmount
      return () => {
        hls.destroy();
        stopStreaming();
      };
    } else if (videoRef.current) {
      // Fallback for browsers like Safari that support HLS natively
      videoRef.current.src = videoUrl;
    }
  }, [videoUrl]); // Empty dependency array ensures this runs only once

  return (
    <video ref={videoRef} width="100%" autoPlay>
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoStreaming;
