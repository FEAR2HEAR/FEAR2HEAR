import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Bounds, useGLTF } from "@react-three/drei";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import "../App.css";


/* =========================================================
   SAM
   ========================================================= */

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


/* =========================================================
   FORMAT TIMER
   ========================================================= */

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(
    0,
    Number(totalSeconds) || 0
  );

  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}


/* =========================================================
   PRESENTATION
   ========================================================= */

export default function Presentation() {

  const navigate = useNavigate();

  /* =======================================================
     TOPIC + TIME
     ======================================================= */

  const topic =
    localStorage.getItem("presentationTopic") ||
    "Chưa có chủ đề";

  const savedMinutes =
    Number(
      localStorage.getItem("presentationMinutes")
    ) || 5;


  /* =======================================================
     TIMER
     ======================================================= */

  const [timeLeft, setTimeLeft] = useState(
    savedMinutes * 60
  );

  const timeLeftRef = useRef(
    savedMinutes * 60
  );


  /* =======================================================
     CAMERA
     ======================================================= */

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] =
    useState(false);

  const [mediaReady, setMediaReady] =
    useState(false);

  const [speechError, setSpeechError] =
    useState("");


  /* =======================================================
     SPEECH TO TEXT
     ======================================================= */

  const [transcript, setTranscript] =
    useState("");

  const recognitionRef =
    useRef(null);

  const finalTranscriptRef =
    useRef("");

  const shouldRestartRecognitionRef =
    useRef(true);


  /* =======================================================
     SILENCE
     ======================================================= */

  const lastSpeechAtRef =
    useRef(Date.now());

  const [silenceWarning, setSilenceWarning] =
    useState(false);


  /* =======================================================
     FILLER / ẤP ÚNG
     ======================================================= */

  const fillerTimesRef =
    useRef([]);

  const [fillerWarning, setFillerWarning] =
    useState(false);

  /* =======================================================
     KIỂM SOÁT NỘI DUNG
     ======================================================= */

  const [contentWarning, setContentWarning] =
    useState(false);

  const topicKeywordsRef =
    useRef([]);

  useEffect(() => {
    const stopWords = new Set([
      "của", "và", "là", "cho", "trong", "một",
      "những", "các", "với", "được", "này",
      "đó", "khi", "người", "về", "thì", "có",
      "không", "hay", "như", "từ", "đến",
      "bạn", "mình", "chúng", "ta", "the",
      "and", "for", "with", "this", "that",
      "about", "from", "into", "are", "was",
    ]);

    topicKeywordsRef.current =
      topic
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/[^a-z0-9\\s]/g, " ")
        .split(/\\s+/)
        .filter(
          (word) =>
            word.length >= 3 &&
            !stopWords.has(word)
        );

  }, [topic]);


  /* =======================================================
     EYE / CAMERA
     ======================================================= */

  const lookingAwaySinceRef =
    useRef(null);

  const [gazeWarning, setGazeWarning] =
    useState(false);


  /* =======================================================
     PERFORMANCE METRICS
     ======================================================= */

  const silenceStartedAtRef = useRef(null);
  const gazeStartedAtRef = useRef(null);

  const performanceMetricsRef = useRef({
    silenceCount: 0,
    totalSilenceDuration: 0,
    maxSilenceDuration: 0,
    gazeAwayCount: 0,
    totalGazeAwayDuration: 0,
    maxGazeAwayDuration: 0,
    fillerCount: 0,
  });

  const closePresentationPerformanceIntervals = () => {
    const now = Date.now();

    if (silenceStartedAtRef.current !== null) {
      const duration = (now - silenceStartedAtRef.current) / 1000;
      performanceMetricsRef.current.totalSilenceDuration += Math.max(0, duration);
      performanceMetricsRef.current.maxSilenceDuration = Math.max(
        performanceMetricsRef.current.maxSilenceDuration,
        Math.max(0, duration)
      );
      silenceStartedAtRef.current = null;
    }

    if (gazeStartedAtRef.current !== null) {
      const duration = (now - gazeStartedAtRef.current) / 1000;
      performanceMetricsRef.current.totalGazeAwayDuration += Math.max(0, duration);
      performanceMetricsRef.current.maxGazeAwayDuration = Math.max(
        performanceMetricsRef.current.maxGazeAwayDuration,
        Math.max(0, duration)
      );
      gazeStartedAtRef.current = null;
    }
  };

  const savePresentationPerformance = () => {
    closePresentationPerformanceIntervals();

    localStorage.setItem(
      "presentationPerformanceMetrics",
      JSON.stringify({
        ...performanceMetricsRef.current,
        totalSilenceDuration: Number(performanceMetricsRef.current.totalSilenceDuration.toFixed(1)),
        maxSilenceDuration: Number(performanceMetricsRef.current.maxSilenceDuration.toFixed(1)),
        totalGazeAwayDuration: Number(performanceMetricsRef.current.totalGazeAwayDuration.toFixed(1)),
        maxGazeAwayDuration: Number(performanceMetricsRef.current.maxGazeAwayDuration.toFixed(1)),
      })
    );
  };


  /* =======================================================
     FINISH
     ======================================================= */

  const [showFinishConfirm, setShowFinishConfirm] =
    useState(false);

  const [presentationFinished, setPresentationFinished] =
    useState(false);


  /* =======================================================
     CAMERA + MICROPHONE
     ======================================================= */

  useEffect(() => {

    let cancelled = false;

    async function startMedia() {

      try {

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            "Camera/Microphone không được hỗ trợ."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        if (cancelled) {

          stream
            .getTracks()
            .forEach((track) => track.stop());

          return;
        }

        streamRef.current =
          stream;

        if (videoRef.current) {

          videoRef.current.srcObject =
            stream;

        }

        // Chỉ khởi động Speech Recognition sau khi mic đã được cấp quyền.
        setMediaReady(true);

      } catch (error) {

        console.error(
          "Camera/Microphone:",
          error
        );

        setCameraError(true);

      }
    }

    startMedia();

    return () => {

      cancelled = true;

      if (streamRef.current) {

        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

      }

    };

  }, []);


  /* =======================================================
     SPEECH TO TEXT
     ======================================================= */

  useEffect(() => {

    if (!mediaReady || presentationFinished) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      setSpeechError(
        "Trình duyệt này không hỗ trợ nhận giọng nói. Hãy dùng Google Chrome trên máy tính."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang =
      "vi-VN";

    recognition.continuous =
      true;

    recognition.interimResults =
      true;

    recognition.maxAlternatives = 1;


    recognition.onresult =
      (event) => {

        let interimText = "";


        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {

          const text =
            event.results[i][0].transcript;


          if (!text.trim()) {
            continue;
          }


          /* Có tiếng nói */
          const speechNow = Date.now();

          if (silenceStartedAtRef.current !== null) {
            const duration =
              (speechNow - silenceStartedAtRef.current) / 1000;

            performanceMetricsRef.current.totalSilenceDuration += Math.max(0, duration);
            performanceMetricsRef.current.maxSilenceDuration = Math.max(
              performanceMetricsRef.current.maxSilenceDuration,
              Math.max(0, duration)
            );
            silenceStartedAtRef.current = null;
          }

          lastSpeechAtRef.current = speechNow;
          setSilenceWarning(false);


          if (
            event.results[i].isFinal
          ) {

            finalTranscriptRef.current +=
              text + " ";


            /* ---------------------------------------
               PHÁT HIỆN ẤP ÚNG
               --------------------------------------- */

            const fillerRegex =
              /\b(ừm+|ờm+|ừ+|ờ+|à+|ơ+|kiểu là|kiểu như|nói chung là|thì là)\b/gi;

            const matches =
              text.match(fillerRegex);


            if (matches) {

              const now =
                Date.now();

              matches.forEach(() => {

                fillerTimesRef.current.push(now);
                performanceMetricsRef.current.fillerCount += 1;

              });

            }

          } else {

            interimText +=
              text;

          }

        }


        setTranscript(
          (
            finalTranscriptRef.current +
            interimText
          ).trim()
        );

      };


    recognition.onerror =
      (event) => {

        console.log(
          "Speech recognition:",
          event.error
        );

        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {

          shouldRestartRecognitionRef.current =
            false;

          setSpeechError(
            "Microphone đã bị từ chối cho nhận giọng nói. Hãy kiểm tra quyền Microphone của fear2hear.vercel.app."
          );

          return;
        }

        if (event.error === "network") {
          setSpeechError(
            "Dịch vụ nhận giọng nói của trình duyệt đang không kết nối được. Hãy thử Chrome và tải lại trang."
          );
        } else if (event.error === "audio-capture") {
          setSpeechError(
            "Không lấy được âm thanh từ microphone. Hãy kiểm tra microphone đang hoạt động."
          );
        } else if (event.error === "no-speech") {
          setSpeechError("");
        }

      };


    recognition.onend =
      () => {

        if (
          shouldRestartRecognitionRef.current &&
          timeLeftRef.current > 0 &&
          !presentationFinished
        ) {

          setTimeout(() => {
            try {
              recognition.start();
            } catch {
              // Recognition có thể đang ở trạng thái STARTING.
            }
          }, 250);

        }

      };


    recognitionRef.current =
      recognition;


    try {

      recognition.start();
      setSpeechError("");

    } catch (error) {

      console.error("Không thể khởi động Speech Recognition:", error);

      setSpeechError(
        "Chưa thể khởi động nhận giọng nói. Hãy thử tải lại trang bằng Google Chrome."
      );

    }


    return () => {

      shouldRestartRecognitionRef.current =
        false;

      try {

        recognition.stop();

      } catch {

        // bỏ qua

      }

    };

  }, [presentationFinished]);


  /* =======================================================
     TIMER REF
     ======================================================= */

  useEffect(() => {

    timeLeftRef.current =
      timeLeft;

  }, [timeLeft]);


  /* =======================================================
     TIMER
     ======================================================= */

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


  /* =======================================================
     AI COACH:
     IM LẶNG + ẤP ÚNG
     ======================================================= */

  useEffect(() => {

    if (
      presentationFinished ||
      timeLeft <= 0
    ) {

      return;
    }


    const checker =
      setInterval(() => {

        const now =
          Date.now();


        /* ---------------------------------------------
           IM LẶNG 7 GIÂY
           --------------------------------------------- */

        const silenceSeconds =
          (
            now -
            lastSpeechAtRef.current
          ) / 1000;


        if (silenceSeconds >= 6) {

          setSilenceWarning(true);

          if (silenceStartedAtRef.current === null) {
            silenceStartedAtRef.current = lastSpeechAtRef.current + 6000;
            performanceMetricsRef.current.silenceCount += 1;
          }

        } else {

          setSilenceWarning(false);

        }


        /* ---------------------------------------------
           ẤP ÚNG TRONG 15 GIÂY GẦN NHẤT
           --------------------------------------------- */

        fillerTimesRef.current =
          fillerTimesRef.current.filter(
            (time) =>
              now - time <= 15000
          );


        /*
         * 3 lần ấp úng trong 15 giây
         * → cảnh báo
         */

        if (
          fillerTimesRef.current.length >= 3
        ) {

          setFillerWarning(true);

        } else {

          setFillerWarning(false);

        }

      }, 500);


    return () => {

      clearInterval(checker);

    };

  }, [
    presentationFinished,
    timeLeft,
  ]);


  /* =======================================================
     KIỂM TRA NỘI DUNG CÓ BÁM CHỦ ĐỀ
     ======================================================= */

  useEffect(() => {
    if (
      presentationFinished ||
      timeLeft <= 0
    ) {
      return;
    }

    const checker = setInterval(() => {
      const spokenText =
        finalTranscriptRef.current.trim();

      // Chưa đủ dữ liệu để đánh giá.
      if (spokenText.length < 60) {
        setContentWarning(false);
        return;
      }

      const normalizeWords = (value) =>
        value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(Boolean);

      const spokenWords =
        new Set(normalizeWords(spokenText));

      const topicKeywords =
        topicKeywordsRef.current;

      if (topicKeywords.length === 0) {
        setContentWarning(false);
        return;
      }

      const matched =
        topicKeywords.filter((word) =>
          spokenWords.has(word)
        ).length;

      const coverage =
        matched / topicKeywords.length;

      /*
       * Nếu người nói đã nói khá dài nhưng gần như
       * không dùng bất kỳ từ khóa nào của chủ đề,
       * cảnh báo ngay.
       *
       * Ví dụ chủ đề: "Học lịch sử có cần thiết không?"
       * mà transcript nói hoàn toàn về thời tiết,
       * đồ ăn, game... thì matched sẽ bằng 0.
       */
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


  /* =======================================================
     FACE LANDMARK + NHÌN CAMERA
     ======================================================= */

  useEffect(() => {

    if (
      presentationFinished ||
      timeLeft <= 0
    ) {
      return;
    }

    let cancelled = false;
    let animationFrame = null;
    let faceLandmarker = null;
    let lastDetectionTime = 0;

    async function setupFaceTracking() {
      try {
        const vision =
          await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
          );

        if (cancelled) {
          return;
        }

        const options = {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        };

        // Thử GPU trước, nếu máy/trình duyệt không hỗ trợ thì dùng CPU.
        try {
          faceLandmarker =
            await FaceLandmarker.createFromOptions(
              vision,
              {
                ...options,
                baseOptions: {
                  ...options.baseOptions,
                  delegate: "GPU",
                },
              }
            );
        } catch (gpuError) {
          console.warn(
            "FaceLandmarker GPU lỗi, chuyển sang CPU:",
            gpuError
          );

          faceLandmarker =
            await FaceLandmarker.createFromOptions(
              vision,
              options
            );
        }

        if (cancelled) {
          return;
        }

        function detect() {
          if (cancelled) {
            return;
          }

          animationFrame =
            requestAnimationFrame(detect);

          const video = videoRef.current;

          if (
            !video ||
            video.readyState < 2 ||
            video.videoWidth === 0
          ) {
            return;
          }

          const now = performance.now();

          if (
            now - lastDetectionTime < 100
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
              if (gazeStartedAtRef.current !== null) {
                const duration =
                  (Date.now() - gazeStartedAtRef.current) / 1000;
                performanceMetricsRef.current.totalGazeAwayDuration += Math.max(0, duration);
                performanceMetricsRef.current.maxGazeAwayDuration = Math.max(
                  performanceMetricsRef.current.maxGazeAwayDuration,
                  Math.max(0, duration)
                );
                gazeStartedAtRef.current = null;
              }

              lookingAwaySinceRef.current = null;
              setGazeWarning(false);
              return;
            }

            /*
             * 33/133 = 2 khóe mắt trái
             * 362/263 = 2 khóe mắt phải
             * 468/473 = tâm 2 mống mắt
             *
             * Tính vị trí mống mắt bên trong từng mắt.
             * Nếu mống mắt lệch quá lâu về một phía,
             * coi như người dùng đang nhìn lệch camera.
             */

            const leftOuter = landmarks[33];
            const leftInner = landmarks[133];
            const rightInner = landmarks[362];
            const rightOuter = landmarks[263];
            const leftIris = landmarks[468];
            const rightIris = landmarks[473];
            const nose = landmarks[1];
            const leftFace = landmarks[234];
            const rightFace = landmarks[454];

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
                leftInner.x - leftOuter.x
              );

            const rightEyeWidth =
              Math.abs(
                rightOuter.x - rightInner.x
              );

            if (
              leftEyeWidth < 0.001 ||
              rightEyeWidth < 0.001
            ) {
              return;
            }

            const leftRatio =
              (leftIris.x - leftOuter.x) /
              (leftInner.x - leftOuter.x);

            const rightRatio =
              (rightIris.x - rightInner.x) /
              (rightOuter.x - rightInner.x);

            const validLeftRatio =
              Math.min(
                1,
                Math.max(0, leftRatio)
              );

            const validRightRatio =
              Math.min(
                1,
                Math.max(0, rightRatio)
              );

            const eyesLookingAway =
              validLeftRatio < 0.22 ||
              validLeftRatio > 0.78 ||
              validRightRatio < 0.22 ||
              validRightRatio > 0.78;

            /*
             * Bổ sung hướng quay đầu để trường hợp
             * người dùng quay hẳn mặt sang bên vẫn được bắt.
             */
            const faceWidth =
              Math.abs(
                rightFace.x - leftFace.x
              );

            const faceCenter =
              (leftFace.x + rightFace.x) / 2;

            const headOffset =
              faceWidth > 0.001
                ? Math.abs(
                    nose.x - faceCenter
                  ) / faceWidth
                : 0;

            const headLookingAway =
              headOffset > 0.22;

            const lookingAway =
              eyesLookingAway ||
              headLookingAway;

            if (!lookingAway) {
              if (gazeStartedAtRef.current !== null) {
                const duration =
                  (Date.now() - gazeStartedAtRef.current) / 1000;
                performanceMetricsRef.current.totalGazeAwayDuration += Math.max(0, duration);
                performanceMetricsRef.current.maxGazeAwayDuration = Math.max(
                  performanceMetricsRef.current.maxGazeAwayDuration,
                  Math.max(0, duration)
                );
                gazeStartedAtRef.current = null;
              }

              lookingAwaySinceRef.current = null;
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
              (
                Date.now() -
                lookingAwaySinceRef.current
              ) / 1000;

            // Nhìn lệch liên tục 2 giây mới cảnh báo.
            if (awaySeconds >= 2) {
              setGazeWarning(true);

              if (gazeStartedAtRef.current === null) {
                gazeStartedAtRef.current = lookingAwaySinceRef.current;
                performanceMetricsRef.current.gazeAwayCount += 1;
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
        } catch {
          // bỏ qua
        }
      }
    };

  }, []);

  /* =======================================================
     HẾT GIỜ
     ======================================================= */

  useEffect(() => {

    if (timeLeft !== 0 || presentationFinished) {
      return;
    }

    shouldRestartRecognitionRef.current =
      false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // bỏ qua
      }
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());
    }

    // Cho người dùng nhìn thấy thông báo HẾT GIỜ
    // trong một khoảng ngắn rồi chuyển sang trang tiếp theo.
    const redirectTimer = setTimeout(() => {
      localStorage.setItem(
        "presentationTranscript",
        finalTranscriptRef.current.trim()
      );
      localStorage.setItem(
        "presentationFinishedByTimeout",
        "true"
      );
      savePresentationPerformance();
      navigate("/sam-questions");
    }, 1600);

    return () => {
      clearTimeout(redirectTimer);
    };

  }, [timeLeft, presentationFinished, navigate]);


  /* =======================================================
     ĐÃ XONG
     ======================================================= */

  const handleFinishClick = () => {

    setShowFinishConfirm(true);

  };


  const handleCancelFinish = () => {

    setShowFinishConfirm(false);

  };


  const handleConfirmFinish = () => {

    setShowFinishConfirm(false);

    setPresentationFinished(true);

    setSilenceWarning(false);

    setFillerWarning(false);

    setGazeWarning(false);

    shouldRestartRecognitionRef.current =
      false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // bỏ qua
      }
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());
    }

    // Lưu toàn bộ phần trình bày để AI đọc và tạo câu hỏi phản biện.
    localStorage.setItem(
      "presentationTranscript",
      finalTranscriptRef.current.trim()
    );
    localStorage.setItem(
      "presentationFinishedByTimeout",
      "false"
    );
    savePresentationPerformance();

    // Trường hợp người dùng hoàn thành sớm và xác nhận:
    // chuyển sang trang chuẩn bị trả lời câu hỏi từ SAM.
    navigate("/sam-questions");
  };


  /* =======================================================
     WARNING ƯU TIÊN
     ======================================================= */

  let warning = null;


  if (contentWarning) {

    warning = {
      icon: "📝",
      title: "Nội dung có vẻ đang lệch chủ đề",
      text:
        "Hãy quay lại tập trung vào câu hỏi và chủ đề ban đầu nhé!",
    };

  } else if (gazeWarning) {

    warning = {
      icon: "👀",
      title: "Hãy nhìn vào camera",
      text:
        "Thử giữ ánh mắt hướng về người nghe nhé!",
    };

  } else if (fillerWarning) {

    warning = {
      icon: "💬",
      title: "Bạn đang hơi ấp úng",
      text:
        "Hãy bình tĩnh và nói chậm hơn nhé!",
    };

  } else if (silenceWarning) {

    warning = {
      icon: "⚠️",
      title: "Bạn đang im lặng khá lâu",
      text:
        "Hãy tiếp tục trình bày nhé!",
    };

  }


  /* =======================================================
     GIAO DIỆN
     ======================================================= */

  return (

    <div className="presentation-page">


      {/* ===================================================
          LOGO
          =================================================== */}

      <div className="presentation-logo">
        FEAR2HEAR
      </div>


      {/* ===================================================
          TIMER
          =================================================== */}

      <div
        className="presentation-timer-box"
        style={{
          background: "#ffffff",
          boxShadow: "0 8px 25px rgba(0,0,0,0.22)",
        }}
      >

        <div
          className="presentation-clock"
          style={{ color: "#321348" }}
        >
          ◷
        </div>

        <div
          className="presentation-timer"
          style={{ color: "#321348" }}
        >
          {formatTime(timeLeft)}
        </div>

      </div>


      {speechError &&
        !presentationFinished &&
        timeLeft > 0 && (
          <div
            style={{
              position: "fixed",
              top: "105px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 150,
              width: "620px",
              maxWidth: "calc(100vw - 40px)",
              padding: "12px 18px",
              borderRadius: "16px",
              background: "rgba(115, 39, 39, 0.96)",
              color: "#ffffff",
              textAlign: "center",
              fontFamily: '"Noto Sans", sans-serif',
              fontSize: "15px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            🎙️ {speechError}
          </div>
        )}


      {/* ===================================================
          WARNING
          =================================================== */}

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
                whiteSpace: "nowrap",
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


      {/* ===================================================
          SAM
          =================================================== */}

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


      {/* ===================================================
          CAMERA
          =================================================== */}

      <div className="presentation-camera-box">

        {cameraError ? (

          <div className="camera-error">

            Không thể truy cập camera
            <br />

            Vui lòng cho phép
            Camera và Microphone.

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


      {/* ===================================================
          SAM TEXT
          =================================================== */}

      <div
        className="presentation-sam-text"
        style={{
          background: "#2d0758",
        }}
      >

        <div className="sam-listening">
          SAM đang nghe
        </div>

        <div className="sam-instruction">
          Bạn hãy trình bày:
        </div>

        <div className="sam-topic">
          {topic}
        </div>

      </div>


      {/* ===================================================
          SCRIPT
          =================================================== */}

      <div
        className="presentation-script-box"
        style={{
          background: "#2d0758",
        }}
      >

        {transcript ? (

          <div className="script-text">
            {transcript}
          </div>

        ) : (

          <div className="script-placeholder">
            Hãy bắt đầu trình bày...
          </div>

        )}

      </div>


      {/* ===================================================
          NÚT ĐÃ XONG
          =================================================== */}

      {!presentationFinished &&
        timeLeft > 0 && (

          <button
            onClick={handleFinishClick}
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
              background: "#ffffff",
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


      {/* ===================================================
          CONFIRM MODAL
          =================================================== */}

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
            justifyContent: "center",
          }}
        >

          <div
            style={{
              width: "620px",
              maxWidth:
                "calc(100vw - 40px)",
              padding: "36px 42px",
              borderRadius: "28px",
              background: "#372b46",
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
                whiteSpace: "nowrap",
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
                  borderRadius: "15px",
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
                  borderRadius: "15px",
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


      {/* ===================================================
          KẾT THÚC
          =================================================== */}

      {(timeLeft === 0 ||
        presentationFinished) && (

        <div
          className="presentation-timeup"
        >

          <div
            className="presentation-timeup-title"
          >
            {presentationFinished
              ? "HOÀN THÀNH"
              : "HẾT GIỜ"}
          </div>

        </div>

      )}

    </div>

  );
}