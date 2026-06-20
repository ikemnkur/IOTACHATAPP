import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Alert,
  Card,
  FormLabel,
  Select,
  MenuItem,
  alpha,
  LinearProgress,
  Chip,
  IconButton,
  Fade,
  Zoom,
  Tooltip,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import MicIcon from "@mui/icons-material/Mic";
import VideocamIcon from "@mui/icons-material/Videocam";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SettingsIcon from "@mui/icons-material/Settings";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";

/**
 * Polyfill for getUserMedia to support older browsers
 */
const polyfillGetUserMedia = () => {
  // Older browsers might not have mediaDevices at all
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  // Some browsers partially implement mediaDevices
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // First get the legacy getUserMedia
      const getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      // If no getUserMedia support at all
      if (!getUserMedia) {
        return Promise.reject(
          new Error("getUserMedia is not implemented in this browser")
        );
      }

      // Otherwise, wrap the legacy getUserMedia with a Promise
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
};

/**
 * Check if media devices are supported
 */
const isMediaDevicesSupported = () => {
  return !!(
    navigator.mediaDevices?.getUserMedia ||
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
  );
};

/**
 * Get browser information
 */
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (ua.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("Chrome") > -1) {
    browserName = "Chrome";
    browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("Safari") > -1) {
    browserName = "Safari";
    browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
    browserName = "Edge";
    browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
    browserName = "Opera";
    browserVersion = ua.match(/OPR\/([0-9.]+)/)?.[1] || "Unknown";
  }

  return { browserName, browserVersion, userAgent: ua };
};

/**
 * Cross-browser getUserMedia implementation
 */
const getCompatibleUserMedia = async (constraints) => {
  // Apply polyfill first
  polyfillGetUserMedia();

  // Check if any form of getUserMedia is supported
  if (!isMediaDevicesSupported()) {
    throw new Error(
      "getUserMedia is not supported in this browser. Please use a modern browser like Chrome, Firefox, Safari, or Edge."
    );
  }

  try {
    // Try modern API first
    if (navigator.mediaDevices?.getUserMedia) {
      return await navigator.mediaDevices.getUserMedia(constraints);
    }

    // Fallback to legacy API
    const getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

    if (getUserMedia) {
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }

    throw new Error("No getUserMedia implementation found");
  } catch (err) {
    console.error("Error accessing media devices:", err);

    // Provide more helpful error messages
    if (
      err.name === "NotAllowedError" ||
      err.name === "PermissionDeniedError"
    ) {
      throw new Error(
        "Camera/microphone permission denied. Please allow access in your browser settings."
      );
    } else if (
      err.name === "NotFoundError" ||
      err.name === "DevicesNotFoundError"
    ) {
      throw new Error(
        "No camera or microphone found. Please connect a device and try again."
      );
    } else if (
      err.name === "NotReadableError" ||
      err.name === "TrackStartError"
    ) {
      throw new Error(
        "Camera/microphone is already in use by another application."
      );
    } else if (
      err.name === "OverconstrainedError" ||
      err.name === "ConstraintNotSatisfiedError"
    ) {
      throw new Error(
        "Camera/microphone does not meet the required constraints."
      );
    } else if (err.name === "TypeError") {
      throw new Error("Invalid media constraints. Please check your settings.");
    } else if (err.name === "SecurityError") {
      throw new Error(
        "Media access blocked due to security restrictions. Please use HTTPS."
      );
    }

    throw err;
  }
};

/**
 * Get available media devices with cross-browser support
 */
const getCompatibleMediaDevices = async () => {
  polyfillGetUserMedia();

  try {
    if (navigator.mediaDevices?.enumerateDevices) {
      return await navigator.mediaDevices.enumerateDevices();
    }

    // Fallback for older browsers
    if (MediaStreamTrack?.getSources) {
      return new Promise((resolve) => {
        MediaStreamTrack.getSources((sources) => {
          resolve(sources);
        });
      });
    }

    // If no enumeration is available, return empty array
    console.warn("Device enumeration not supported");
    return [];
  } catch (err) {
    console.error("Error enumerating devices:", err);
    return [];
  }
};

// ==========================================
// KEYFRAME ANIMATIONS
// ==========================================

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const audioWave = keyframes`
  0%, 100% {
    height: 30%;
  }
  50% {
    height: 80%;
  }
`;

// ==========================================
// STYLED COMPONENTS
// ==========================================

const SetupContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: `linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(2),
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "300px",
    background: `radial-gradient(ellipse at top, ${alpha(
      theme.palette.primary.main,
      0.3
    )}, transparent)`,
    pointerEvents: "none",
  },
}));

const SetupCard = styled(Card)(({ theme }) => ({
  maxWidth: 700,
  width: "100%",
  borderRadius: 20,
  background: `linear-gradient(135deg, ${alpha("#1e1e2e", 0.95)}, ${alpha(
    "#2a2a3e",
    0.95
  )})`,
  backdropFilter: "blur(20px)",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.5)}`,
  padding: theme.spacing(3),
  position: "relative",
  animation: `${fadeInUp} 0.5s cubic-bezier(0.4, 0, 0.2, 1)`,
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(2),
}));

const Title = styled(Typography)(({ theme }) => ({
  fontSize: "1.75rem",
  fontWeight: 800,
  background: `linear-gradient(135deg, ${theme.palette.common.white}, ${alpha(
    theme.palette.primary.light,
    0.8
  )})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  marginBottom: theme.spacing(0.5),
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  fontSize: "0.9rem",
  color: alpha(theme.palette.common.white, 0.6),
  marginBottom: theme.spacing(2),
}));

const ContentGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 300px",
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

const DevicesColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const PreviewColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const DeviceSection = styled(Box)({
  display: "flex",
  flexDirection: "column",
});

const DeviceLabel = styled(FormLabel)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  fontSize: "0.85rem",
  fontWeight: 700,
  color: theme.palette.common.white,
  "& .MuiSvgIcon-root": {
    fontSize: "1.2rem",
    color: theme.palette.primary.main,
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: 10,
  backgroundColor: alpha(theme.palette.common.white, 0.05),
  color: theme.palette.common.white,
  fontSize: "0.85rem",
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.08),
    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
  },
  "&.Mui-focused": {
    backgroundColor: alpha(theme.palette.common.white, 0.1),
    border: `1px solid ${theme.palette.primary.main}`,
  },
  "& .MuiSelect-select": {
    padding: "10px 14px",
  },
}));

const VideoPreviewContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: alpha(theme.palette.common.black, 0.5),
  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  aspectRatio: "16 / 9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const VideoPreview = styled("video")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  backgroundColor: "#000",
});

const NoVideoPlaceholder = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(1),
  color: alpha(theme.palette.common.white, 0.4),
  padding: theme.spacing(2),
  "& .MuiSvgIcon-root": {
    fontSize: "3rem",
    opacity: 0.5,
  },
}));

const MicLevelContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: alpha(theme.palette.common.black, 0.5),
  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  padding: theme.spacing(2),
  height: 80,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const AudioWaveform = styled(Box)(({ theme, level }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  height: "100%",
}));

const AudioBar = styled(Box)(({ theme, active, delay }) => ({
  width: 6,
  backgroundColor: active
    ? theme.palette.primary.main
    : alpha(theme.palette.common.white, 0.2),
  borderRadius: 3,
  height: active ? "60%" : "20%",
  animation: active ? `${audioWave} 0.8s ease-in-out infinite` : "none",
  animationDelay: `${delay}s`,
  transition: "all 0.3s ease",
}));

const ActionButtons = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(2),
  justifyContent: "space-between",
}));

const CancelButton = styled(Button)(({ theme }) => ({
  borderRadius: 10,
  padding: theme.spacing(1.25, 3),
  fontSize: "0.9rem",
  fontWeight: 600,
  textTransform: "none",
  color: alpha(theme.palette.common.white, 0.8),
  border: `2px solid ${alpha(theme.palette.common.white, 0.2)}`,
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.05),
    borderColor: alpha(theme.palette.common.white, 0.4),
  },
}));

const SkipButton = styled(Button)(({ theme }) => ({
  borderRadius: 10,
  padding: theme.spacing(1.25, 3),
  fontSize: "0.9rem",
  fontWeight: 600,
  textTransform: "none",
  color: alpha(theme.palette.warning.main, 0.9),
  border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`,
  "&:hover": {
    backgroundColor: alpha(theme.palette.warning.main, 0.1),
    borderColor: theme.palette.warning.main,
  },
}));

const JoinButton = styled(Button)(({ theme }) => ({
  borderRadius: 10,
  padding: theme.spacing(1.25, 4),
  fontSize: "1rem",
  fontWeight: 700,
  textTransform: "none",
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  color: theme.palette.common.white,
  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.6)}`,
  },
  "&:disabled": {
    background: alpha(theme.palette.common.white, 0.1),
    color: alpha(theme.palette.common.white, 0.3),
    boxShadow: "none",
  },
}));

const StatusChip = styled(Chip)(({ theme, ready }) => ({
  position: "absolute",
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
  backgroundColor: ready
    ? alpha(theme.palette.success.main, 0.2)
    : alpha(theme.palette.warning.main, 0.2),
  color: ready ? theme.palette.success.light : theme.palette.warning.light,
  border: `1px solid ${
    ready
      ? alpha(theme.palette.success.main, 0.5)
      : alpha(theme.palette.warning.main, 0.5)
  }`,
  fontWeight: 600,
  fontSize: "0.75rem",
  height: 28,
  animation: ready ? `${pulse} 2s ease-in-out infinite` : "none",
}));

const TestButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.2),
  color: theme.palette.primary.light,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
  width: 36,
  height: 36,
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.4),
  },
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 3,
  borderRadius: 2,
  backgroundColor: alpha(theme.palette.common.white, 0.1),
  marginBottom: theme.spacing(2),
  "& .MuiLinearProgress-bar": {
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  },
}));

// ==========================================
// MAIN COMPONENT
// ==========================================

const PreRoomSetup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [mediaSupported, setMediaSupported] = useState(true);
  const [mediaReady, setMediaReady] = useState(false);
  const [error, setError] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [devices, setDevices] = useState({
    audioInput: "",
    audioOutput: "",
    video: "",
  });
  const [availableDevices, setAvailableDevices] = useState({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  });

  const urlQueryParams = new URLSearchParams(location.search);
  const roomMode = urlQueryParams.get("mode");

  // Check browser compatibility on mount
  useEffect(() => {
    polyfillGetUserMedia();

    if (!isMediaDevicesSupported()) {
      const browserInfo = getBrowserInfo();
      setError(
        `Your browser (${browserInfo.browserName}) does not support video calls. Please use a modern browser like Chrome, Firefox, Safari, or Edge.`
      );
      setMediaSupported(false);
    }
  }, []);

  // Get available devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permissions first using compatible function
        const stream = await getCompatibleUserMedia({
          audio: true,
          video: true,
        });

        // Stop the permission request stream
        stream.getTracks().forEach((track) => track.stop());

        const deviceList = await getCompatibleMediaDevices();
        const audioInputs = deviceList.filter((d) => d.kind === "audioinput");
        const audioOutputs = deviceList.filter((d) => d.kind === "audiooutput");
        const videoInputs = deviceList.filter((d) => d.kind === "videoinput");

        console.log("Available devices:", {
          audioInputs: audioInputs.length,
          audioOutputs: audioOutputs.length,
          videoInputs: videoInputs.length,
        });

        setAvailableDevices({
          audioInputs,
          audioOutputs,
          videoInputs,
        });

        // Load saved preferences first
        const savedDevices = localStorage.getItem("preferredDevices");
        if (savedDevices) {
          try {
            const parsed = JSON.parse(savedDevices);
            console.log("Loading saved devices:", parsed);

            // Verify saved devices still exist
            const audioInputExists = audioInputs.find(
              (d) => d.deviceId === parsed.audioInput
            );
            const audioOutputExists = audioOutputs.find(
              (d) => d.deviceId === parsed.audioOutput
            );
            const videoExists = videoInputs.find(
              (d) => d.deviceId === parsed.video
            );

            setDevices({
              audioInput:
                audioInputExists?.deviceId || audioInputs[0]?.deviceId || "",
              audioOutput:
                audioOutputExists?.deviceId || audioOutputs[0]?.deviceId || "",
              video: videoExists?.deviceId || videoInputs[0]?.deviceId || "",
            });
            return;
          } catch (err) {
            console.error("Error parsing saved devices:", err);
          }
        }

        // Auto-select first devices if no saved preferences
        setDevices({
          audioInput: audioInputs[0]?.deviceId || "",
          audioOutput: audioOutputs[0]?.deviceId || "",
          video: videoInputs[0]?.deviceId || "",
        });
      } catch (err) {
        console.error("Error enumerating devices:", err);
        setError(
          err.message ||
            "Unable to access media devices. Please check permissions."
        );
      }
    };

    if (mediaSupported) {
      getDevices();
    }
  }, [mediaSupported]);

  // Start microphone monitoring
  useEffect(() => {
    let stream = null;

    const startMicMonitoring = async () => {
      try {
        if (devices.audioInput) {
          stream = await getCompatibleUserMedia({
            audio: { deviceId: { exact: devices.audioInput } },
            video: false,
          });

          setAudioStream(stream);

          // Create audio context for level monitoring
          const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const microphone = audioContext.createMediaStreamSource(stream);
          analyser.fftSize = 256;
          microphone.connect(analyser);

          audioContextRef.current = audioContext;
          analyserRef.current = analyser;

          // Monitor audio levels
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b) / dataArray.length;
            setMicLevel(Math.min(100, average));
            animationFrameRef.current = requestAnimationFrame(checkLevel);
          };
          checkLevel();
        }
      } catch (err) {
        console.error("Error starting mic monitoring:", err);
      }
    };

    if (mediaSupported) {
      startMicMonitoring();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [devices.audioInput, mediaSupported]);

  // Start video preview - Using compatible function
  useEffect(() => {
    let stream = null;
    let mounted = true;

    const startVideoPreview = async () => {
      try {
        if (devices.video && roomMode !== "spectator" && mounted) {
          console.log("Starting video preview for device:", devices.video);

          // Stop any existing stream first
          if (videoStream) {
            videoStream.getTracks().forEach((track) => {
              console.log("Stopping existing track:", track.label);
              track.stop();
            });
          }

          const constraints = {
            video: {
              deviceId: { exact: devices.video },
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30 },
            },
            audio: false,
          };

          console.log("Getting user media with constraints:", constraints);
          stream = await getCompatibleUserMedia(constraints);
          console.log(
            "Video stream obtained:",
            stream.getVideoTracks()[0]?.label
          );
          console.log(
            "Video track state:",
            stream.getVideoTracks()[0]?.readyState
          );

          if (mounted) {
            setVideoStream(stream);

            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
              if (videoRef.current && stream) {
                console.log("Setting srcObject on video element");
                videoRef.current.srcObject = stream;

                // Multiple play attempts for browser compatibility
                const attemptPlay = () => {
                  if (videoRef.current) {
                    videoRef.current
                      .play()
                      .then(() => {
                        console.log("Video playing successfully");
                      })
                      .catch((err) => {
                        console.error("Play attempt failed:", err);
                        // Retry after a short delay
                        setTimeout(attemptPlay, 100);
                      });
                  }
                };

                // Wait for metadata
                videoRef.current.onloadedmetadata = () => {
                  console.log("Video metadata loaded");
                  attemptPlay();
                };

                // Also try to play immediately in case metadata is already loaded
                if (videoRef.current.readyState >= 2) {
                  console.log("Metadata already loaded, playing immediately");
                  attemptPlay();
                }
              } else {
                console.log("videoRef.current not ready:", !!videoRef.current);
              }
            });
          }
        } else if (!devices.video && videoStream) {
          // Clean up if device is deselected
          console.log("Cleaning up video stream");
          videoStream.getTracks().forEach((track) => track.stop());
          setVideoStream(null);
        }
      } catch (err) {
        console.error("Error starting video preview:", err);
        setError(err.message || "Unable to access camera.");
      }
    };

    if (mediaSupported) {
      startVideoPreview();
    }

    return () => {
      console.log("Cleanup: unmounting video preview");
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => {
          console.log("Cleanup: stopping track:", track.label);
          track.stop();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices.video, roomMode, mediaSupported]);

  // Calculate setup progress
  useEffect(() => {
    let progress = 0;
    if (devices.audioInput) progress += 40;
    if (devices.audioOutput) progress += 20;
    if (roomMode === "spectator" || devices.video) progress += 40;
    setSetupProgress(progress);
  }, [devices, roomMode]);

  // Check if ready
  useEffect(() => {
    if (roomMode === "spectator") {
      setMediaReady(true);
    } else {
      setMediaReady(Boolean(devices.audioInput && devices.video));
    }
  }, [devices, roomMode]);

  const handleJoinRoom = () => {
    try {
      console.log("Joining room with devices:", devices);

      // Stop all streams
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }

      localStorage.setItem("preferredDevices", JSON.stringify(devices));
      localStorage.setItem("mediaSetupComplete", "true");
      localStorage.setItem("setupTimestamp", Date.now().toString());

      if (roomMode === 'spectator') {
        navigate(`/room/spectate/${id}`);
      } else {
        navigate(`/room/join/${id}`);
      }
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError("Failed to save preferences. Please try again.");
    }
  };

  const handleCancel = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
    }
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }
    localStorage.removeItem("mediaSetupComplete");
    navigate("/explore");
  };

  const handleSkip = () => {
    if (roomMode === "spectator") {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      localStorage.setItem("mediaSetupComplete", "true");
      localStorage.setItem("setupTimestamp", Date.now().toString());
      navigate(`/room/${id}?mode=${roomMode}`);
    }
  };

  const testAudio = () => {
    setIsTestingAudio(true);
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 440;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      setIsTestingAudio(false);
    }, 500);
  };

  if (!mediaSupported) {
    return (
      <SetupContainer>
        <SetupCard elevation={0}>
          <HeaderSection>
            <Typography variant="h5" color="error" gutterBottom>
              Browser Not Supported
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {error}
            </Typography>
            <Box mt={3}>
              <CancelButton onClick={() => navigate("/explore")}>
                Go Back
              </CancelButton>
            </Box>
          </HeaderSection>
        </SetupCard>
      </SetupContainer>
    );
  }

  return (
    <SetupContainer>
      <Zoom in timeout={400}>
        <SetupCard elevation={0}>
          <StatusChip
            icon={mediaReady ? <CheckCircleIcon /> : <SettingsIcon />}
            label={mediaReady ? "Ready" : "Setup"}
            ready={mediaReady}
            size="small"
          />

          <HeaderSection>
            <SettingsIcon
              sx={{
                fontSize: "2.5rem",
                color: "primary.main",
                mb: 1,
                opacity: 0.8,
              }}
            />
            <Title>Setup Your Media Devices</Title>
            <Subtitle>
              {roomMode === "spectator"
                ? "Configure audio (optional for spectators)"
                : "Test camera and microphone before joining"}
            </Subtitle>
            <ProgressBar variant="determinate" value={setupProgress} />
          </HeaderSection>

          {error && (
            <Fade in>
              <Alert
                severity="error"
                onClose={() => setError(null)}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  fontSize: "0.85rem",
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          <ContentGrid>
            <DevicesColumn>
              {/* Microphone */}
              <DeviceSection>
                <DeviceLabel>
                  <MicIcon />
                  Microphone
                  {roomMode !== "spectator" && (
                    <span style={{ color: "#f44336" }}>*</span>
                  )}
                </DeviceLabel>
                <StyledSelect
                  value={devices.audioInput}
                  onChange={(e) =>
                    setDevices((prev) => ({
                      ...prev,
                      audioInput: e.target.value,
                    }))
                  }
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select microphone
                  </MenuItem>
                  {availableDevices.audioInputs.map((device) => (
                    <MenuItem key={device.deviceId} value={device.deviceId}>
                      {device.label ||
                        `Microphone ${device.deviceId.slice(0, 5)}`}
                    </MenuItem>
                  ))}
                </StyledSelect>
              </DeviceSection>

              {/* Speaker */}
              <DeviceSection>
                <DeviceLabel>
                  <VolumeUpIcon />
                  Speaker
                </DeviceLabel>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <StyledSelect
                    value={devices.audioOutput}
                    onChange={(e) =>
                      setDevices((prev) => ({
                        ...prev,
                        audioOutput: e.target.value,
                      }))
                    }
                    displayEmpty
                    fullWidth
                  >
                    <MenuItem value="" disabled>
                      Select speaker
                    </MenuItem>
                    {availableDevices.audioOutputs.map((device) => (
                      <MenuItem key={device.deviceId} value={device.deviceId}>
                        {device.label ||
                          `Speaker ${device.deviceId.slice(0, 5)}`}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                  <Tooltip title="Test speaker">
                    <TestButton
                      onClick={testAudio}
                      disabled={!devices.audioOutput || isTestingAudio}
                      size="small"
                    >
                      <PlayArrowIcon fontSize="small" />
                    </TestButton>
                  </Tooltip>
                </Box>
              </DeviceSection>

              {/* Camera */}
              {roomMode !== "spectator" && (
                <DeviceSection>
                  <DeviceLabel>
                    <VideocamIcon />
                    Camera
                    <span style={{ color: "#f44336" }}>*</span>
                  </DeviceLabel>
                  <StyledSelect
                    value={devices.video}
                    onChange={(e) =>
                      setDevices((prev) => ({ ...prev, video: e.target.value }))
                    }
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select camera
                    </MenuItem>
                    {availableDevices.videoInputs.map((device) => (
                      <MenuItem key={device.deviceId} value={device.deviceId}>
                        {device.label ||
                          `Camera ${device.deviceId.slice(0, 5)}`}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </DeviceSection>
              )}
            </DevicesColumn>

            <PreviewColumn>
              {/* Microphone Level */}
              <MicLevelContainer>
                <AudioWaveform>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <AudioBar
                      key={i}
                      active={micLevel > i * 12.5}
                      delay={i * 0.1}
                    />
                  ))}
                </AudioWaveform>
                {micLevel === 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      color: alpha("#fff", 0.4),
                      fontSize: "0.75rem",
                    }}
                  >
                    Speak to test mic
                  </Typography>
                )}
              </MicLevelContainer>

              {/* Video Preview */}
              {roomMode !== "spectator" && (
                <VideoPreviewContainer>
                  {devices.video ? (
                    <>
                      <VideoPreview ref={videoRef} autoPlay playsInline muted />
                      {/* Debug info - remove in production */}
                      {import.meta.env.DEV && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            background: "rgba(0,0,0,0.7)",
                            color: "#0f0",
                            padding: "4px 8px",
                            fontSize: "10px",
                            borderRadius: 1,
                            zIndex: 10,
                            fontFamily: "monospace",
                          }}
                        >
                          <div>Video: {devices.video ? "✓" : "✗"}</div>
                          <div>Stream: {videoStream ? "✓" : "✗"}</div>
                          <div>
                            Tracks: {videoStream?.getVideoTracks().length || 0}
                          </div>
                          <div>
                            State:{" "}
                            {videoStream?.getVideoTracks()[0]?.readyState ||
                              "N/A"}
                          </div>
                        </Box>
                      )}
                    </>
                  ) : (
                    <NoVideoPlaceholder>
                      <VideocamOffIcon />
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.75rem" }}
                      >
                        Select a camera
                      </Typography>
                    </NoVideoPlaceholder>
                  )}
                </VideoPreviewContainer>
              )}
            </PreviewColumn>
          </ContentGrid>

          <ActionButtons>
            <CancelButton onClick={handleCancel}>Cancel</CancelButton>

            <Box sx={{ display: "flex", gap: 1.5 }}>
              {roomMode === "spectator" && (
                <SkipButton onClick={handleSkip}>Skip</SkipButton>
              )}
              <JoinButton
                onClick={handleJoinRoom}
                disabled={!mediaReady}
                endIcon={<ArrowForwardIcon />}
              >
                Join Room
              </JoinButton>
            </Box>
          </ActionButtons>
        </SetupCard>
      </Zoom>
    </SetupContainer>
  );
};

export default PreRoomSetup;
