import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Bounds, useGLTF } from "@react-three/drei";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import "../App.css";

const UI_FONT = '"Poppins", sans-serif';
const SPECIAL_FONT = '"Paytone One", sans-serif';
const QUESTION_TIME = 7 * 60;

function SamModel() {
  const { scene } = useGLTF("/SAM.glb");
  return <primitive object={scene} position={[0, 0, 0]} />;
}

useGLTF.preload("/SAM.glb");

function formatTime(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function emptyMetrics() {
  return {
    silenceCount: 0,
    totalSilenceDuration: 0,
    maxSilenceDuration: 0,
    gazeAwayCount: 0,
    totalGazeAwayDuration: 0,
    maxGazeAwayDuration: 0,
    fillerCount: 0,
  };
}

export default function SamDebate() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [answer, setAnswer] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalAnswerRef = useRef("");
  const shouldListenRef = useRef(true);
  const answersRef = useRef([]);

  const lastSpeechAtRef = useRef(Date.now());
  const silenceStartedAtRef = useRef(null);
  const gazeStartedAtRef = useRef(null);
  const metricsRef = useRef(emptyMetrics());

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("samQuestions") || "[]");
      if (Array.isArray(saved) && saved.length > 0) {
        const loaded = saved.slice(0, 4);
        setQuestions(loaded);
        const existing = JSON.parse(localStorage.getItem("samAnswers") || "[]");
        answersRef.current = loaded.map((question, index) => existing[index] || { question, answer: "" });
        localStorage.setItem("samAnswers", JSON.stringify(answersRef.current));
        lastSpeechAtRef.current = Date.now();
      }
    } catch (error) {
      console.error("Không thể lấy câu hỏi SAM:", error);
    }
  }, []);

  const closeIntervals = () => {
    const now = Date.now();

    if (silenceStartedAtRef.current !== null) {
      const duration = Math.max(0, (now - silenceStartedAtRef.current) / 1000);
      metricsRef.current.totalSilenceDuration += duration;
      metricsRef.current.maxSilenceDuration = Math.max(metricsRef.current.maxSilenceDuration, duration);
      silenceStartedAtRef.current = null;
    }

    if (gazeStartedAtRef.current !== null) {
      const duration = Math.max(0, (now - gazeStartedAtRef.current) / 1000);
      metricsRef.current.totalGazeAwayDuration += duration;
      metricsRef.current.maxGazeAwayDuration = Math.max(metricsRef.current.maxGazeAwayDuration, duration);
      gazeStartedAtRef.current = null;
    }
  };

  const saveMetrics = () => {
    closeIntervals();
    localStorage.setItem(
      "samPerformanceMetrics",
      JSON.stringify({
        ...metricsRef.current,
        totalSilenceDuration: Number(metricsRef.current.totalSilenceDuration.toFixed(1)),
        maxSilenceDuration: Number(metricsRef.current.maxSilenceDuration.toFixed(1)),
        totalGazeAwayDuration: Number(metricsRef.current.totalGazeAwayDuration.toFixed(1)),
        maxGazeAwayDuration: Number(metricsRef.current.maxGazeAwayDuration.toFixed(1)),
      })
    );
  };

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Camera:", error);
        setCameraError(true);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    shouldListenRef.current = true;
    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (!text.trim()) continue;

        const now = Date.now();
        if (silenceStartedAtRef.current !== null) {
          const duration = Math.max(0, (now - silenceStartedAtRef.current) / 1000);
          metricsRef.current.totalSilenceDuration += duration;
          metricsRef.current.maxSilenceDuration = Math.max(metricsRef.current.maxSilenceDuration, duration);
          silenceStartedAtRef.current = null;
        }
        lastSpeechAtRef.current = now;

        if (event.results[i].isFinal) {
          finalAnswerRef.current += `${text} `;

          const fillers = text.match(/\b(ừm+|ờm+|ừ+|ờ+|à+|ơ+|kiểu là|kiểu như|nói chung là|thì là)\b/gi);
          if (fillers) metricsRef.current.fillerCount += fillers.length;
        } else {
          interim += text;
        }
      }

      setAnswer(`${finalAnswerRef.current}${interim}`.trim());
    };

    recognition.onerror = (event) => {
      console.log("Speech recognition:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldListenRef.current = false;
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current && recognitionRef.current === recognition) {
        setTimeout(() => {
          try { recognition.start(); } catch {}
        }, 200);
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}

    return () => {
      shouldListenRef.current = false;
      try { recognition.stop(); } catch {}
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
  }, [questionIndex]);

  useEffect(() => {
    if (questions.length === 0 || timeLeft <= 0) return;

    const checker = setInterval(() => {
      if ((Date.now() - lastSpeechAtRef.current) / 1000 >= 6 && silenceStartedAtRef.current === null) {
        silenceStartedAtRef.current = lastSpeechAtRef.current + 6000;
        metricsRef.current.silenceCount += 1;
      }
    }, 500);

    return () => clearInterval(checker);
  }, [questionIndex, questions.length, timeLeft]);

  useEffect(() => {
    if (questions.length === 0 || timeLeft <= 0) return;

    let cancelled = false;
    let animationFrame = null;
    let faceLandmarker = null;
    let lastDetectionTime = 0;

    async function setupFaceTracking() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        if (cancelled) return;

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (cancelled) return;

        const detect = () => {
          if (cancelled) return;
          animationFrame = requestAnimationFrame(detect);

          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;

          const now = performance.now();
          if (now - lastDetectionTime < 125) return;
          lastDetectionTime = now;

          try {
            const landmarks = faceLandmarker.detectForVideo(video, now).faceLandmarks?.[0];
            if (!landmarks) {
              closeGaze();
              return;
            }

            const leftOuter = landmarks[33];
            const leftInner = landmarks[133];
            const rightInner = landmarks[362];
            const rightOuter = landmarks[263];
            const leftIris = landmarks[468];
            const rightIris = landmarks[473];
            const nose = landmarks[1];
            const leftFace = landmarks[234];
            const rightFace = landmarks[454];

            if (!leftOuter || !leftInner || !rightInner || !rightOuter || !leftIris || !rightIris || !nose || !leftFace || !rightFace) return;

            const leftRatio = (leftIris.x - leftOuter.x) / (leftInner.x - leftOuter.x);
            const rightRatio = (rightIris.x - rightInner.x) / (rightOuter.x - rightInner.x);
            const eyesAway = leftRatio < 0.22 || leftRatio > 0.78 || rightRatio < 0.22 || rightRatio > 0.78;
            const faceWidth = Math.abs(rightFace.x - leftFace.x);
            const faceCenter = (leftFace.x + rightFace.x) / 2;
            const headOffset = faceWidth > 0.001 ? Math.abs(nose.x - faceCenter) / faceWidth : 0;
            const lookingAway = eyesAway || headOffset > 0.22;

            if (!lookingAway) {
              closeGaze();
              return;
            }

            if (gazeStartedAtRef.current === null) {
              gazeStartedAtRef.current = Date.now();
              metricsRef.current.gazeAwayCount += 1;
            }
          } catch (error) {
            console.error("SAM face tracking error:", error);
          }
        };

        detect();
      } catch (error) {
        console.error("SAM FaceLandmarker error:", error);
      }
    }

    function closeGaze() {
      if (gazeStartedAtRef.current === null) return;
      const duration = Math.max(0, (Date.now() - gazeStartedAtRef.current) / 1000);
      metricsRef.current.totalGazeAwayDuration += duration;
      metricsRef.current.maxGazeAwayDuration = Math.max(metricsRef.current.maxGazeAwayDuration, duration);
      gazeStartedAtRef.current = null;
    }

    setupFaceTracking();

    return () => {
      cancelled = true;
      closeGaze();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (faceLandmarker) {
        try { faceLandmarker.close(); } catch {}
      }
    };
  }, [questionIndex, questions.length]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const saveCurrentAnswer = () => {
    const question = questions[questionIndex] || "";
    answersRef.current[questionIndex] = {
      question,
      answer: finalAnswerRef.current.trim(),
    };
    localStorage.setItem("samAnswers", JSON.stringify(answersRef.current));
  };

  useEffect(() => {
    if (timeLeft !== 0) return;

    shouldListenRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    saveCurrentAnswer();
    saveMetrics();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const redirectTimer = setTimeout(() => navigate("/feedback"), 1600);
    return () => clearTimeout(redirectTimer);
  }, [timeLeft, navigate]);

  const handleNextClick = () => setShowConfirm(true);
  const handleCancelNext = () => setShowConfirm(false);

  const handleConfirmNext = () => {
    setShowConfirm(false);
    saveCurrentAnswer();

    if (questionIndex >= questions.length - 1) {
      saveMetrics();
      shouldListenRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      navigate("/feedback");
      return;
    }

    try { recognitionRef.current?.stop(); } catch {}
    setQuestionIndex((previous) => previous + 1);
    setTimeLeft(QUESTION_TIME);
    lastSpeechAtRef.current = Date.now();
    silenceStartedAtRef.current = null;
    finalAnswerRef.current = "";
    setAnswer("");
  };

  if (questions.length === 0) {
    return (
      <div className="sam-debate-page" style={{ fontFamily: UI_FONT }}>
        <div className="sam-debate-logo" style={{ fontFamily: UI_FONT }}>FEAR2HEAR</div>
        <div className="sam-debate-loading" style={{ fontFamily: UI_FONT, whiteSpace: "nowrap", width: "100%", textAlign: "center" }}>
          SAM đang chuẩn bị câu hỏi...
        </div>
      </div>
    );
  }

  const currentQuestion = questions[questionIndex] || "";

  return (
    <div className="sam-debate-page" style={{ fontFamily: UI_FONT }}>
      <div className="sam-debate-logo" style={{ fontFamily: UI_FONT }}>FEAR2HEAR</div>

      <div className="sam-debate-timer" style={{ fontFamily: UI_FONT }}>
        <span className="sam-debate-clock">◷</span>
        <span className="sam-debate-time">{formatTime(timeLeft)}</span>
      </div>

      {timeLeft > 0 && (
        <button className="sam-debate-next-button" onClick={handleNextClick} style={{ fontFamily: UI_FONT }}>
          {questionIndex === questions.length - 1 ? "HOÀN THÀNH" : "CÂU HỎI TIẾP THEO"}
        </button>
      )}

      <div className="sam-debate-question" style={{ fontFamily: UI_FONT }}>
        <div className="sam-debate-question-label">CÂU HỎI PHẢN BIỆN</div>
        <div className="sam-debate-question-text">{currentQuestion}</div>
      </div>

      <div className="sam-debate-main" style={{ fontFamily: UI_FONT }}>
        <div className="sam-debate-character">
          <Canvas camera={{ position: [0, 0, 6], fov: 35, near: 0.01, far: 1000 }} gl={{ antialias: true, alpha: true }}>
            <ambientLight intensity={1.25} />
            <directionalLight position={[4, 5, 6]} intensity={1.2} />
            <directionalLight position={[-4, 2, 4]} intensity={0.45} />
            <Bounds fit margin={1.55}><SamModel /></Bounds>
          </Canvas>
          <div className="sam-debate-character-text">
            <div className="sam-listening">SAM đang nghe</div>
            <div className="sam-instruction">Hãy trả lời câu hỏi của SAM nhé!</div>
          </div>
        </div>

        <div className="sam-debate-camera">
          {cameraError ? (
            <div className="camera-error">Không thể truy cập camera<br />Vui lòng cho phép Camera.</div>
          ) : (
            <video ref={videoRef} className="sam-debate-video" autoPlay muted playsInline />
          )}

          <div className="sam-debate-answer">
            {answer ? <div className="sam-debate-answer-text">{answer}</div> : <div className="sam-debate-answer-placeholder">Hãy bắt đầu trả lời...</div>}
          </div>
        </div>
      </div>

      {!speechSupported && <div className="sam-speech-warning">Trình duyệt này không hỗ trợ nhận diện giọng nói.</div>}

      {showConfirm && (
        <div className="sam-debate-modal-overlay">
          <div className="sam-debate-modal" style={{ fontFamily: UI_FONT }}>
            <div className="sam-debate-modal-title">
              {questionIndex === questions.length - 1 ? "Bạn đã trả lời xong chưa?" : "Bạn đã trả lời xong câu hỏi vừa rồi chưa?"}
            </div>
            <div className="sam-debate-modal-text">
              {questionIndex === questions.length - 1 ? "Nếu xác nhận, phần trả lời phản biện sẽ kết thúc." : "Nếu xác nhận, SAM sẽ chuyển sang câu hỏi tiếp theo."}
            </div>
            <div className="sam-debate-modal-actions">
              <button className="sam-debate-back-btn" onClick={handleCancelNext}>QUAY LẠI</button>
              <button className="sam-debate-confirm-btn" onClick={handleConfirmNext}>XÁC NHẬN</button>
            </div>
          </div>
        </div>
      )}

      {timeLeft === 0 && (
        <div className="presentation-timeup">
          <div className="presentation-timeup-title" style={{ fontFamily: SPECIAL_FONT }}>HẾT GIỜ</div>
        </div>
      )}
    </div>
  );
}
