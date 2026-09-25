import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  onAuthStateChanged,
} from "firebase/auth";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { Canvas } from "@react-three/fiber";
import { Bounds, useGLTF } from "@react-three/drei";
import { auth } from "../firebase";
import "../App.css";

// =========================================================
// SAM
// =========================================================

function SamModel() {
  const { scene } = useGLTF("/SAM.glb");

  return (
    <primitive
      object={scene}
      position={[0, 0, 0]}
    />
  );
}

useGLTF.preload("/SAM.glb");

// =========================================================
// FORMAT TIMER
// =========================================================

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(
    0,
    Number(totalSeconds) || 0
  );

  const minutes = Math.floor(
    safeSeconds / 60
  );

  const seconds =
    safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

// =========================================================
// PRESENTATION
// =========================================================

export default function Presentation() {
  const navigate = useNavigate();

  // =======================================================
  // FIREBASE USER
  // =======================================================

  const [firebaseUser, setFirebaseUser] =
    useState(null);

  const [authChecking, setAuthChecking] =
    useState(true);

  // =======================================================
  // FIREBASE AUTH CHECK
  // =======================================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          console.log(
            "🔥 Firebase auth state:",
            user
          );

          if (!user) {
            console.log(
              "❌ Không có Firebase user"
            );

            navigate("/login", {
              replace: true,
            });

            return;
          }

          console.log(
            "✅ Firebase user:",
            user.email
          );

          setFirebaseUser(user);
          setAuthChecking(false);
        }
      );

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  // =======================================================
  // TOPIC + TIME
  // =======================================================

  const topic =
    localStorage.getItem(
      "presentationTopic"
    ) || "Chưa có chủ đề";

  const savedMinutes =
    Number(
      localStorage.getItem(
        "presentationMinutes"
      )
    ) || 5;

  // =======================================================
  // TIMER
  // =======================================================

  const [timeLeft, setTimeLeft] =
    useState(savedMinutes * 60);

  const timeLeftRef =
    useRef(savedMinutes * 60);

  // =======================================================
  // CAMERA
  // =======================================================

  const videoRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const [cameraError, setCameraError] =
    useState(false);

  // =======================================================
  // MICROPHONE
  // =======================================================

  const microphoneStreamRef =
    useRef(null);

  // =======================================================
  // SPEECH RECOGNITION
  // =======================================================

  const [transcript, setTranscript] =
    useState("");

  const recognitionRef =
    useRef(null);

  const recognitionRunningRef =
    useRef(false);

  const finalTranscriptRef =
    useRef("");

  const shouldRestartRecognitionRef =
    useRef(false);

  const recognitionRestartTimerRef =
    useRef(null);

  const [speechListening, setSpeechListening] =
    useState(false);

  const [speechError, setSpeechError] =
    useState("");

  // =======================================================
  // PRESENTATION FINISHED
  // =======================================================

  const [
    presentationFinished,
    setPresentationFinished,
  ] = useState(false);

  const presentationFinishedRef =
    useRef(false);

  // =======================================================
  // SILENCE
  // =======================================================

  const lastSpeechAtRef =
    useRef(Date.now());

  const [
    silenceWarning,
    setSilenceWarning,
  ] = useState(false);

  const silenceStartedAtRef =
    useRef(null);

  // =======================================================
  // FILLER
  // =======================================================

  const fillerTimesRef =
    useRef([]);

  const [
    fillerWarning,
    setFillerWarning,
  ] = useState(false);

  // =======================================================
  // CONTENT
  // =======================================================

  const [
    contentWarning,
    setContentWarning,
  ] = useState(false);

  const topicKeywordsRef =
    useRef([]);

  // =======================================================
  // GAZE
  // =======================================================

  const [
    gazeWarning,
    setGazeWarning,
  ] = useState(false);

  const lookingAwaySinceRef =
    useRef(null);

  const gazeStartedAtRef =
    useRef(null);

  // =======================================================
  // PERFORMANCE
  // =======================================================

  const performanceMetricsRef =
    useRef({
      silenceCount: 0,
      totalSilenceDuration: 0,
      maxSilenceDuration: 0,
      gazeAwayCount: 0,
      totalGazeAwayDuration: 0,
      maxGazeAwayDuration: 0,
      fillerCount: 0,
    });

  // =======================================================
  // FINISH MODAL
  // =======================================================

  const [
    showFinishConfirm,
    setShowFinishConfirm,
  ] = useState(false);

  // =======================================================
  // TOPIC KEYWORDS
  // =======================================================

  useEffect(() => {
    const stopWords = new Set([
      "của",
      "và",
      "là",
      "cho",
      "trong",
      "một",
      "những",
      "các",
      "với",
      "được",
      "này",
      "đó",
      "khi",
      "người",
      "về",
      "thì",
      "có",
      "không",
      "hay",
      "như",
      "từ",
      "đến",
      "bạn",
      "mình",
      "chúng",
      "ta",
      "the",
      "and",
      "for",
      "with",
      "this",
      "that",
      "about",
      "from",
      "into",
      "are",
      "was",
    ]);

    topicKeywordsRef.current =
      topic
        .toLowerCase()
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-z0-9\s]/g,
          " "
        )
        .split(/\s+/)
        .filter(
          (word) =>
            word.length >= 3 &&
            !stopWords.has(word)
        );
  }, [topic]);

  // =======================================================
  // SAVE PERFORMANCE
  // =======================================================

  const savePresentationPerformance =
    () => {
      const now = Date.now();

      let totalSilenceDuration =
        performanceMetricsRef.current
          .totalSilenceDuration;

      let maxSilenceDuration =
        performanceMetricsRef.current
          .maxSilenceDuration;

      if (
        silenceStartedAtRef.current !==
        null
      ) {
        const duration =
          (now -
            silenceStartedAtRef.current) /
          1000;

        totalSilenceDuration +=
          Math.max(0, duration);

        maxSilenceDuration =
          Math.max(
            maxSilenceDuration,
            Math.max(0, duration)
          );
      }

      localStorage.setItem(
        "presentationPerformanceMetrics",
        JSON.stringify({
          ...performanceMetricsRef.current,

          totalSilenceDuration:
            Number(
              totalSilenceDuration.toFixed(
                1
              )
            ),

          maxSilenceDuration:
            Number(
              maxSilenceDuration.toFixed(
                1
              )
            ),
        })
      );
    };

  // =======================================================
  // FIREBASE AUTH WAIT
  // =======================================================

  if (authChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#10051d",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            '"Noto Sans", sans-serif',
          fontSize: "18px",
        }}
      >
        Đang kiểm tra tài khoản...
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  // =======================================================
  // CAMERA
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {
          throw new Error(
            "Trình duyệt không hỗ trợ camera."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: true,
              audio: false,
            }
          );

        if (cancelled) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          try {
            await videoRef.current.play();
          } catch (error) {
            console.log(
              "Camera play:",
              error
            );
          }
        }

        console.log(
          "📷 CAMERA ĐÃ SẴN SÀNG"
        );
      } catch (error) {
        console.error(
          "Camera error:",
          error
        );

        setCameraError(true);
      }
    }

    startCamera();

    return () => {
      cancelled = true;

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        streamRef.current = null;
      }
    };
  }, []);

  // =======================================================
  // SPEECH RECOGNITION SETUP
  // =======================================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(
        "Trình duyệt này không hỗ trợ nhận giọng nói. Hãy dùng Google Chrome."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log(
        "🎙️ SPEECH STARTED"
      );

      recognitionRunningRef.current =
        true;

      setSpeechListening(true);
      setSpeechError("");
    };

    recognition.onaudiostart = () => {
      console.log(
        "🎤 MICROPHONE AUDIO STARTED"
      );
    };

    recognition.onsoundstart = () => {
      console.log(
        "🔊 SOUND DETECTED"
      );
    };

    recognition.onspeechstart = () => {
      console.log(
        "🗣️ GIỌNG NÓI ĐÃ ĐƯỢC PHÁT HIỆN"
      );
    };

    recognition.onresult = (event) => {
      console.log(
        "🎯 SPEECH RESULT:",
        event
      );

      let interimText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result =
          event.results[i];

        const text =
          result?.[0]?.transcript ||
          "";

        if (!text.trim()) {
          continue;
        }

        console.log(
          "📝 NHẬN ĐƯỢC:",
          text,
          "FINAL:",
          result.isFinal
        );

        const now = Date.now();

        lastSpeechAtRef.current =
          now;

        setSilenceWarning(false);

        if (result.isFinal) {
          finalTranscriptRef.current +=
            text.trim() + " ";

          const fillerRegex =
            /\b(ừm+|ờm+|ừ+|ờ+|à+|ơ+|kiểu là|kiểu như|nói chung là|thì là)\b/gi;

          const matches =
            text.match(fillerRegex);

          if (matches) {
            matches.forEach(() => {
              fillerTimesRef.current.push(
                now
              );

              performanceMetricsRef.current
                .fillerCount += 1;
            });
          }
        } else {
          interimText += text;
        }
      }

      const newTranscript =
        (
          finalTranscriptRef.current +
          interimText
        ).trim();

      setTranscript(newTranscript);

      localStorage.setItem(
        "presentationLiveTranscript",
        newTranscript
      );
    };

    recognition.onerror = (event) => {
      console.error(
        "❌ SPEECH ERROR:",
        event.error
      );

      recognitionRunningRef.current =
        false;

      setSpeechListening(false);

      if (
        event.error === "not-allowed" ||
        event.error ===
          "service-not-allowed"
      ) {
        shouldRestartRecognitionRef.current =
          false;

        setSpeechError(
          "Chrome đang chặn microphone. Hãy bấm biểu tượng 🔒 cạnh địa chỉ website → Microphone → Allow → tải lại trang."
        );

        return;
      }

      if (
        event.error ===
        "audio-capture"
      ) {
        setSpeechError(
          "Không tìm thấy microphone. Hãy kiểm tra microphone của máy."
        );

        return;
      }

      if (
        event.error === "network"
      ) {
        setSpeechError(
          "Chrome không kết nối được dịch vụ nhận giọng nói. Hãy kiểm tra Internet rồi bấm lại."
        );

        return;
      }

      if (
        event.error === "no-speech"
      ) {
        console.log(
          "ℹ️ Không phát hiện giọng nói."
        );

        setSpeechError("");

        return;
      }

      if (
        event.error === "aborted"
      ) {
        console.log(
          "ℹ️ Speech bị aborted."
        );

        setSpeechError("");

        return;
      }

      setSpeechError(
        `Speech Recognition lỗi: ${event.error}`
      );
    };

    recognition.onend = () => {
      console.log(
        "🔚 SPEECH END"
      );

      recognitionRunningRef.current =
        false;

      setSpeechListening(false);

      if (
        recognitionRestartTimerRef.current
      ) {
        clearTimeout(
          recognitionRestartTimerRef.current
        );
      }

      if (
        shouldRestartRecognitionRef.current &&
        !presentationFinishedRef.current &&
        timeLeftRef.current > 0
      ) {
        recognitionRestartTimerRef.current =
          setTimeout(() => {
            if (
              !recognitionRunningRef.current &&
              shouldRestartRecognitionRef.current &&
              !presentationFinishedRef.current &&
              timeLeftRef.current > 0
            ) {
              try {
                recognition.start();

                console.log(
                  "🔄 SPEECH RESTART"
                );
              } catch (error) {
                console.log(
                  "Restart error:",
                  error?.message
                );
              }
            }
          }, 800);
      }
    };

    recognitionRef.current =
      recognition;

    return () => {
      shouldRestartRecognitionRef.current =
        false;

      recognitionRunningRef.current =
        false;

      if (
        recognitionRestartTimerRef.current
      ) {
        clearTimeout(
          recognitionRestartTimerRef.current
        );

        recognitionRestartTimerRef.current =
          null;
      }

      try {
        recognition.abort();
      } catch {}

      recognitionRef.current = null;
    };
  }, []);

  // =======================================================
  // START SPEECH
  // =======================================================

  const startSpeechRecognition =
    async () => {
      setSpeechError("");

      if (!firebaseUser) {
        setSpeechError(
          "Bạn cần đăng nhập tài khoản trước khi luyện tập."
        );

        navigate("/login");
        return;
      }

      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechError(
          "Hãy mở website bằng Google Chrome để sử dụng nhận giọng nói."
        );

        return;
      }

      const recognition =
        recognitionRef.current;

      if (!recognition) {
        setSpeechError(
          "Speech Recognition chưa sẵn sàng. Hãy tải lại trang."
        );

        return;
      }

      if (
        recognitionRunningRef.current
      ) {
        console.log(
          "🎙️ ĐANG NGHE RỒI"
        );

        return;
      }

      // ===================================================
      // XIN QUYỀN MICROPHONE
      // ===================================================

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {
          throw new Error(
            "Microphone API không được hỗ trợ."
          );
        }

        const micStream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
              video: false,
            }
          );

        // Giữ microphone stream mở
        // trong lúc trình bày.
        microphoneStreamRef.current =
          micStream;

        console.log(
          "🎤 MICROPHONE PERMISSION OK"
        );

        console.log(
          "🎤 MIC TRACKS:",
          micStream
            .getAudioTracks()
            .map(
              (track) => ({
                label: track.label,
                enabled:
                  track.enabled,
                readyState:
                  track.readyState,
              })
            )
        );
      } catch (error) {
        console.error(
          "❌ Microphone permission error:",
          error
        );

        setSpeechError(
          "Không thể truy cập microphone. Hãy cho phép Microphone trong Chrome rồi bấm lại."
        );

        return;
      }

      shouldRestartRecognitionRef.current =
        true;

      try {
        recognition.start();

        console.log(
          "🚀 ĐÃ GỌI recognition.start()"
        );
      } catch (error) {
        console.error(
          "❌ START SPEECH ERROR:",
          error
        );

        if (
          error?.name ===
          "InvalidStateError"
        ) {
          recognitionRunningRef.current =
            true;

          setSpeechListening(true);
        } else {
          setSpeechError(
            "Không thể bật nhận giọng nói. Hãy bấm lại nút."
          );
        }
      }
    };

  // =======================================================
  // TIMER REF
  // =======================================================

  useEffect(() => {
    timeLeftRef.current =
      timeLeft;
  }, [timeLeft]);

  // =======================================================
  // TIMER
  // =======================================================

  useEffect(() => {
    if (
      timeLeft <= 0 ||
      presentationFinished
    ) {
      return;
    }

    const timer =
      setInterval(() => {
        setTimeLeft((previous) => {
          if (previous <= 1) {
            return 0;
          }

          return previous - 1;
        });
      }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [
    timeLeft,
    presentationFinished,
  ]);

  // =======================================================
  // SILENCE + FILLER
  // =======================================================

  useEffect(() => {
    if (
      presentationFinished ||
      timeLeft <= 0
    ) {
      return;
    }

    const checker =
      setInterval(() => {
        const now = Date.now();

        const silenceSeconds =
          (now -
            lastSpeechAtRef.current) /
          1000;

        if (silenceSeconds >= 6) {
          setSilenceWarning(true);

          if (
            silenceStartedAtRef.current ===
            null
          ) {
            silenceStartedAtRef.current =
              lastSpeechAtRef.current +
              6000;

            performanceMetricsRef.current
              .silenceCount += 1;
          }
        } else {
          setSilenceWarning(false);

          if (
            silenceStartedAtRef.current !==
            null
          ) {
            const duration =
              (now -
                silenceStartedAtRef.current) /
              1000;

            performanceMetricsRef.current
              .totalSilenceDuration +=
              Math.max(0, duration);

            performanceMetricsRef.current
              .maxSilenceDuration =
              Math.max(
                performanceMetricsRef.current
                  .maxSilenceDuration,
                Math.max(0, duration)
              );

            silenceStartedAtRef.current =
              null;
          }
        }

        fillerTimesRef.current =
          fillerTimesRef.current.filter(
            (time) =>
              now - time <= 15000
          );

        setFillerWarning(
          fillerTimesRef.current.length >=
            3
        );
      }, 500);

    return () => {
      clearInterval(checker);
    };
  }, [
    presentationFinished,
    timeLeft,
  ]);

  // =======================================================
  // CONTENT CHECK
  // =======================================================

  useEffect(() => {
    if (
      presentationFinished ||
      timeLeft <= 0
    ) {
      return;
    }

    const checker =
      setInterval(() => {
        const spokenText =
          finalTranscriptRef.current.trim();

        if (
          spokenText.length < 60
        ) {
          setContentWarning(false);
          return;
        }

        const normalizeWords =
          (value) =>
            value
              .toLowerCase()
              .normalize("NFD")
              .replace(
                /[\u0300-\u036f]/g,
                ""
              )
              .replace(
                /[^a-z0-9\s]/g,
                " "
              )
              .split(/\s+/)
              .filter(Boolean);

        const spokenWords =
          new Set(
            normalizeWords(
              spokenText
            )
          );

        const topicKeywords =
          topicKeywordsRef.current;

        if (
          topicKeywords.length === 0
        ) {
          setContentWarning(false);
          return;
        }

        const matched =
          topicKeywords.filter(
            (word) =>
              spokenWords.has(word)
          ).length;

        const coverage =
          matched /
          topicKeywords.length;

        const clearlyOffTopic =
          spokenText.length >= 120 &&
          matched === 0;

        const veryLowCoverage =
          spokenText.length >= 180 &&
          topicKeywords.length >= 3 &&
          coverage < 0.18;

        setContentWarning(
          clearlyOffTopic ||
            veryLowCoverage
        );
      }, 2500);

    return () => {
      clearInterval(checker);
    };
  }, [
    presentationFinished,
    timeLeft,
  ]);

  // =======================================================
  // FACE TRACKING
  // =======================================================

  useEffect(() => {
    let cancelled = false;
    let animationFrame = null;
    let faceLandmarker = null;
    let lastDetectionTime = 0;

    async function setupFaceTracking() {
      try {
        console.log(
          "👀 Đang khởi tạo FaceLandmarker..."
        );

        const vision =
          await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
          );

        if (cancelled) {
          return;
        }

        faceLandmarker =
          await FaceLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",

                // CPU để tránh tranh WebGL
                // với Three.js.
                delegate: "CPU",
              },

              runningMode: "VIDEO",

              numFaces: 1,

              minFaceDetectionConfidence: 0.5,

              minFacePresenceConfidence: 0.5,

              minTrackingConfidence: 0.5,
            }
          );

        if (cancelled) {
          try {
            faceLandmarker.close();
          } catch {}

          return;
        }

        console.log(
          "✅ FaceLandmarker đã sẵn sàng"
        );

        function detect() {
          if (cancelled) {
            return;
          }

          animationFrame =
            requestAnimationFrame(
              detect
            );

          const video =
            videoRef.current;

          if (
            !video ||
            video.readyState < 2 ||
            video.videoWidth === 0
          ) {
            return;
          }

          const now =
            performance.now();

          // Chỉ detect khoảng 5 FPS
          if (
            now -
              lastDetectionTime <
            200
          ) {
            return;
          }

          lastDetectionTime = now;

          try {
            const result =
              faceLandmarker.detectForVideo(
                video,
                now
              );

            const landmarks =
              result.faceLandmarks?.[0];

            if (!landmarks) {
              if (
                gazeStartedAtRef.current !==
                null
              ) {
                const duration =
                  (Date.now() -
                    gazeStartedAtRef.current) /
                  1000;

                performanceMetricsRef.current
                  .totalGazeAwayDuration +=
                  Math.max(
                    0,
                    duration
                  );

                performanceMetricsRef.current
                  .maxGazeAwayDuration =
                  Math.max(
                    performanceMetricsRef.current
                      .maxGazeAwayDuration,
                    Math.max(
                      0,
                      duration
                    )
                  );

                gazeStartedAtRef.current =
                  null;
              }

              lookingAwaySinceRef.current =
                null;

              setGazeWarning(false);

              return;
            }

            const leftOuter =
              landmarks[33];

            const leftInner =
              landmarks[133];

            const rightInner =
              landmarks[362];

            const rightOuter =
              landmarks[263];

            const leftIris =
              landmarks[468];

            const rightIris =
              landmarks[473];

            const nose =
              landmarks[1];

            const leftFace =
              landmarks[234];

            const rightFace =
              landmarks[454];

            if (
              !leftOuter ||
              !leftInner ||
              !rightInner ||
              !rightOuter ||
              !leftIris ||
              !rightIris ||
              !nose ||
              !leftFace ||
              !rightFace
            ) {
              return;
            }

            const leftEyeWidth =
              Math.abs(
                leftInner.x -
                  leftOuter.x
              );

            const rightEyeWidth =
              Math.abs(
                rightOuter.x -
                  rightInner.x
              );

            if (
              leftEyeWidth <
                0.001 ||
              rightEyeWidth <
                0.001
            ) {
              return;
            }

            const leftRatio =
              (leftIris.x -
                leftOuter.x) /
              (leftInner.x -
                leftOuter.x);

            const rightRatio =
              (rightIris.x -
                rightInner.x) /
              (rightOuter.x -
                rightInner.x);

            const validLeftRatio =
              Math.min(
                1,
                Math.max(
                  0,
                  leftRatio
                )
              );

            const validRightRatio =
              Math.min(
                1,
                Math.max(
                  0,
                  rightRatio
                )
              );

            const eyesLookingAway =
              validLeftRatio <
                0.22 ||
              validLeftRatio >
                0.78 ||
              validRightRatio <
                0.22 ||
              validRightRatio >
                0.78;

            const faceWidth =
              Math.abs(
                rightFace.x -
                  leftFace.x
              );

            const faceCenter =
              (leftFace.x +
                rightFace.x) /
              2;

            const headOffset =
              faceWidth > 0.001
                ? Math.abs(
                    nose.x -
                      faceCenter
                  ) /
                  faceWidth
                : 0;

            const headLookingAway =
              headOffset > 0.22;

            const lookingAway =
              eyesLookingAway ||
              headLookingAway;

            if (!lookingAway) {
              if (
                gazeStartedAtRef.current !==
                null
              ) {
                const duration =
                  (Date.now() -
                    gazeStartedAtRef.current) /
                  1000;

                performanceMetricsRef.current
                  .totalGazeAwayDuration +=
                  Math.max(
                    0,
                    duration
                  );

                performanceMetricsRef.current
                  .maxGazeAwayDuration =
                  Math.max(
                    performanceMetricsRef.current
                      .maxGazeAwayDuration,
                    Math.max(
                      0,
                      duration
                    )
                  );

                gazeStartedAtRef.current =
                  null;
              }

              lookingAwaySinceRef.current =
                null;

              setGazeWarning(false);

              return;
            }

            if (
              lookingAwaySinceRef.current ===
              null
            ) {
              lookingAwaySinceRef.current =
                Date.now();
            }

            const awaySeconds =
              (Date.now() -
                lookingAwaySinceRef.current) /
              1000;

            if (awaySeconds >= 2) {
              setGazeWarning(true);

              if (
                gazeStartedAtRef.current ===
                null
              ) {
                gazeStartedAtRef.current =
                  lookingAwaySinceRef.current;

                performanceMetricsRef.current
                  .gazeAwayCount +=
                  1;
              }
            }
          } catch (error) {
            console.error(
              "Face tracking error:",
              error
            );
          }
        }

        detect();
      } catch (error) {
        console.error(
          "FaceLandmarker error:",
          error
        );
      }
    }

    setupFaceTracking();

    return () => {
      cancelled = true;

      if (animationFrame) {
        cancelAnimationFrame(
          animationFrame
        );
      }

      if (faceLandmarker) {
        try {
          faceLandmarker.close();
        } catch {}
      }
    };
  }, []);

  // =======================================================
  // PRESENTATION FINISHED REF
  // =======================================================

  useEffect(() => {
    presentationFinishedRef.current =
      presentationFinished;
  }, [presentationFinished]);

  // =======================================================
  // TIME UP
  // =======================================================

  useEffect(() => {
    if (
      timeLeft !== 0 ||
      presentationFinished
    ) {
      return;
    }

    shouldRestartRecognitionRef.current =
      false;

    if (
      recognitionRestartTimerRef.current
    ) {
      clearTimeout(
        recognitionRestartTimerRef.current
      );
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (
      microphoneStreamRef.current
    ) {
      microphoneStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      microphoneStreamRef.current =
        null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    const redirectTimer =
      setTimeout(() => {
        const finalText =
          finalTranscriptRef.current.trim();

        localStorage.setItem(
          "presentationTranscript",
          finalText
        );

        localStorage.setItem(
          "presentationLiveTranscript",
          finalText
        );

        localStorage.setItem(
          "presentationFinishedByTimeout",
          "true"
        );

        savePresentationPerformance();

        navigate("/sam-questions");
      }, 1600);

    return () => {
      clearTimeout(
        redirectTimer
      );
    };
  }, [
    timeLeft,
    presentationFinished,
    navigate,
  ]);

  // =======================================================
  // FINISH
  // =======================================================

  const handleFinishClick = () => {
    setShowFinishConfirm(true);
  };

  const handleCancelFinish = () => {
    setShowFinishConfirm(false);
  };

  const handleConfirmFinish = () => {
    setShowFinishConfirm(false);

    setPresentationFinished(true);

    presentationFinishedRef.current =
      true;

    setSilenceWarning(false);
    setFillerWarning(false);
    setGazeWarning(false);

    shouldRestartRecognitionRef.current =
      false;

    if (
      recognitionRestartTimerRef.current
    ) {
      clearTimeout(
        recognitionRestartTimerRef.current
      );

      recognitionRestartTimerRef.current =
        null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (
      microphoneStreamRef.current
    ) {
      microphoneStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      microphoneStreamRef.current =
        null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    const finalText =
      finalTranscriptRef.current.trim();

    localStorage.setItem(
      "presentationTranscript",
      finalText
    );

    localStorage.setItem(
      "presentationLiveTranscript",
      finalText
    );

    localStorage.setItem(
      "presentationFinishedByTimeout",
      "false"
    );

    savePresentationPerformance();

    navigate("/sam-questions");
  };

  // =======================================================
  // WARNING
  // =======================================================

  let warning = null;

  if (contentWarning) {
    warning = {
      icon: "📝",
      title:
        "Nội dung có vẻ đang lệch chủ đề",
      text:
        "Hãy quay lại tập trung vào câu hỏi và chủ đề ban đầu nhé!",
    };
  } else if (gazeWarning) {
    warning = {
      icon: "👀",
      title:
        "Hãy nhìn vào camera",
      text:
        "Thử giữ ánh mắt hướng về người nghe nhé!",
    };
  } else if (fillerWarning) {
    warning = {
      icon: "💬",
      title:
        "Bạn đang hơi ấp úng",
      text:
        "Hãy bình tĩnh và nói chậm hơn nhé!",
    };
  } else if (silenceWarning) {
    warning = {
      icon: "⚠️",
      title:
        "Bạn đang im lặng khá lâu",
      text:
        "Hãy tiếp tục trình bày nhé!",
    };
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="presentation-page">

      {/* LOGO */}

      <div className="presentation-logo">
        FEAR2HEAR
      </div>


      {/* TIMER */}

      <div
        className="presentation-timer-box"
        style={{
          background: "#ffffff",
          boxShadow:
            "0 8px 25px rgba(0,0,0,0.22)",
        }}
      >
        <div
          className="presentation-clock"
          style={{
            color: "#321348",
          }}
        >
          ◷
        </div>

        <div
          className="presentation-timer"
          style={{
            color: "#321348",
          }}
        >
          {formatTime(timeLeft)}
        </div>
      </div>


      {/* MICROPHONE BUTTON */}

      {!presentationFinished &&
        timeLeft > 0 && (
          <button
            type="button"
            onClick={
              startSpeechRecognition
            }
            style={{
              position: "fixed",
              top: "105px",
              left: "50%",
              transform:
                "translateX(-50%)",
              zIndex: 151,
              padding:
                "8px 18px",
              border: "none",
              borderRadius:
                "999px",
              background:
                speechListening
                  ? "rgba(45, 7, 88, 0.96)"
                  : "rgba(115, 39, 39, 0.96)",
              color: "#ffffff",
              fontFamily:
                '"Noto Sans", sans-serif',
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow:
                "0 8px 20px rgba(0,0,0,0.25)",
            }}
          >
            {speechListening
              ? "🎙️ SAM ĐANG NGHE"
              : "🎙️ BẬT NHẬN GIỌNG NÓI"}
          </button>
        )}


      {/* SPEECH ERROR */}

      {speechError &&
        !presentationFinished &&
        timeLeft > 0 && (
          <div
            style={{
              position: "fixed",
              top: "150px",
              left: "50%",
              transform:
                "translateX(-50%)",
              zIndex: 150,
              width: "620px",
              maxWidth:
                "calc(100vw - 40px)",
              padding:
                "12px 18px",
              borderRadius: "16px",
              background:
                "rgba(115, 39, 39, 0.96)",
              color: "#ffffff",
              textAlign: "center",
              fontFamily:
                '"Noto Sans", sans-serif',
              fontSize: "15px",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            🎙️ {speechError}
          </div>
        )}


      {/* WARNING */}

      {warning &&
        !presentationFinished &&
        timeLeft > 0 && (
          <div
            style={{
              position: "fixed",
              top: "105px",
              left: "50%",
              transform:
                "translateX(-50%)",
              zIndex: 150,
              width: "620px",
              maxWidth:
                "calc(100vw - 40px)",
              padding:
                "16px 22px",
              borderRadius: "20px",
              background:
                "rgba(73, 35, 94, 0.98)",
              border:
                "1px solid rgba(255,255,255,0.3)",
              boxShadow:
                "0 12px 35px rgba(0,0,0,0.4)",
              textAlign: "center",
              fontFamily:
                '"Noto Sans", sans-serif',
            }}
          >
            <div
              style={{
                fontSize: "22px",
                fontWeight: 800,
                whiteSpace:
                  "nowrap",
                color: "#ffffff",
              }}
            >
              {warning.icon}{" "}
              {warning.title}
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "16px",
                color: "#ddd3e4",
              }}
            >
              {warning.text}
            </div>
          </div>
        )}


      {/* SAM */}

      <div className="presentation-sam-box">
        <Canvas
          camera={{
            position: [0, 0, 6],
            fov: 35,
            near: 0.01,
            far: 1000,
          }}
          gl={{
            antialias: true,
            alpha: true,
          }}
        >
          <ambientLight
            intensity={1.25}
          />

          <directionalLight
            position={[4, 5, 6]}
            intensity={1.2}
          />

          <directionalLight
            position={[-4, 2, 4]}
            intensity={0.45}
          />

          <Bounds
            fit
            margin={1.55}
          >
            <SamModel />
          </Bounds>
        </Canvas>
      </div>


      {/* CAMERA */}

      <div className="presentation-camera-box">
        {cameraError ? (
          <div className="camera-error">
            Không thể truy cập camera
            <br />
            Vui lòng cho phép Camera.
          </div>
        ) : (
          <video
            ref={videoRef}
            className="presentation-camera"
            autoPlay
            muted
            playsInline
          />
        )}
      </div>


      {/* SAM TEXT */}

      <div
        className="presentation-sam-text"
        style={{
          background:
            "#2d0758",
        }}
      >
        <div className="sam-listening">
          {speechListening
            ? "SAM đang nghe"
            : "SAM chưa nghe"}
        </div>

        <div className="sam-instruction">
          Bạn hãy trình bày:
        </div>

        <div className="sam-topic">
          {topic}
        </div>
      </div>


      {/* SCRIPT */}

      <div
        className="presentation-script-box"
        style={{
          background:
            "#2d0758",
        }}
      >
        {transcript ? (
          <div className="script-text">
            {transcript}
          </div>
        ) : (
          <div className="script-placeholder">
            Hãy bấm "BẬT NHẬN GIỌNG NÓI"
            rồi bắt đầu trình bày...
          </div>
        )}
      </div>


      {/* HOÀN THÀNH */}

      {!presentationFinished &&
        timeLeft > 0 && (
          <button
            onClick={
              handleFinishClick
            }
            style={{
              position: "fixed",
              left: "28px",
              top: "24px",
              transform: "none",
              zIndex: 180,
              width: "210px",
              height: "58px",
              border: "none",
              borderRadius: "18px",
              background:
                "#ffffff",
              color: "#321348",
              fontFamily:
                '"Noto Sans", sans-serif',
              fontSize: "18px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.35)",
            }}
          >
            HOÀN THÀNH
          </button>
        )}


      {/* CONFIRM MODAL */}

      {showFinishConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background:
              "rgba(16, 5, 29, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
          }}
        >
          <div
            style={{
              width: "620px",
              maxWidth:
                "calc(100vw - 40px)",
              padding:
                "36px 42px",
              borderRadius: "28px",
              background:
                "#372b46",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.5)",
              textAlign: "center",
              fontFamily:
                '"Noto Sans", sans-serif',
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                whiteSpace:
                  "nowrap",
                color: "#ffffff",
              }}
            >
              Bạn đã nói xong rồi đúng không?
            </div>

            <div
              style={{
                marginTop: "12px",
                fontSize: "17px",
                lineHeight: 1.5,
                color: "#d8cde0",
              }}
            >
              Bạn có chắc muốn kết thúc
              phần trình bày không?
            </div>

            <div
              style={{
                marginTop: "28px",
                display: "flex",
                gap: "14px",
                justifyContent:
                  "center",
              }}
            >
              <button
                onClick={
                  handleCancelFinish
                }
                style={{
                  width: "150px",
                  height: "50px",
                  border:
                    "1px solid rgba(255,255,255,0.35)",
                  borderRadius:
                    "15px",
                  background:
                    "transparent",
                  color: "#ffffff",
                  fontFamily:
                    '"Noto Sans", sans-serif',
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                QUAY LẠI
              </button>

              <button
                onClick={
                  handleConfirmFinish
                }
                style={{
                  width: "150px",
                  height: "50px",
                  border: "none",
                  borderRadius:
                    "15px",
                  background:
                    "#ffffff",
                  color: "#321348",
                  fontFamily:
                    '"Noto Sans", sans-serif',
                  fontSize: "16px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                XÁC NHẬN
              </button>
            </div>
          </div>
        </div>
      )}


      {/* KẾT THÚC */}

      {(timeLeft === 0 ||
        presentationFinished) && (
        <div className="presentation-timeup">
          <div className="presentation-timeup-title">
            {presentationFinished
              ? "HOÀN THÀNH"
              : "HẾT GIỜ"}
          </div>
        </div>
      )}

    </div>
  );
}