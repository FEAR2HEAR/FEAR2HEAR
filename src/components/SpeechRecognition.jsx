import { useEffect, useRef, useState } from "react";
import "../App.css";

function SpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("🎤 AI đang nghe...");
  const [fillerWarning, setFillerWarning] = useState("");
  const [fillerCount, setFillerCount] = useState(0);

  const recognitionRef = useRef(null);
  const transcriptTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const shouldListenRef = useRef(true);

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Trình duyệt không hỗ trợ Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();

    recognitionRef.current = recognition;

    recognition.lang = "vi-VN";
    recognition.continuous = true;

    // ⭐ Cho chữ xuất hiện nhanh hơn
    recognition.interimResults = true;

    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("🎤 Đóm đang nghe...");
      setStatus("🎤 Đóm đang nghe...");
    };

    recognition.onresult = (event) => {
      let currentText = "";

      // Lấy phần người dùng đang nói
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }

      currentText = currentText.trim();

      if (!currentText) return;

      console.log("Đã nghe:", currentText);

      // =========================
      // PHÁT HIỆN TỪ ĐỆM
      // =========================

      const fillerPattern =
        /\b(ừm+|ờm+|ờ+|à+|ừ+|um+|uh+|hmm+)\b/gi;

      const fillers = currentText.match(fillerPattern);

      if (fillers && fillers.length > 0) {
        setFillerCount((prev) => {
          const newCount = prev + fillers.length;

          // Chỉ cảnh báo khi có từ đệm
          setFillerWarning(
            `⚠️ Bạn đang sử dụng từ đệm "${fillers[0]}" (${newCount} lần)`
          );

          clearTimeout(warningTimerRef.current);

          warningTimerRef.current = setTimeout(() => {
            setFillerWarning("");
          }, 2500);

          return newCount;
        });
      }

      // =========================
      // HIỆN PHỤ ĐỀ
      // =========================

      setTranscript(currentText);

      setStatus("🎤 Đóm đang nghe...");

      // Xóa timer cũ
      clearTimeout(transcriptTimerRef.current);

      // Sau khi ngừng nói một lúc
      transcriptTimerRef.current = setTimeout(() => {
        setStatus("🤖 Đang phân tích...");

        setTimeout(() => {
          setTranscript("");
          setStatus("🎤 Đóm đang nghe...");
        }, 1000);
      }, 1800);
    };

    recognition.onerror = (event) => {
      console.log("Speech Error:", event.error);

      // Không hiện alert vì sẽ làm phiền lúc thuyết trình
      if (event.error === "not-allowed") {
        setStatus("⚠️ Hãy cho phép trình duyệt sử dụng Micro.");
      }

      if (event.error === "no-speech") {
        setStatus("🎤 Đóm đang nghe...");
      }
    };

    recognition.onend = () => {
      console.log("Speech kết thúc");

      // Tự khởi động lại nếu người dùng vẫn đang ở trang Practice
      if (shouldListenRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.log("Không thể khởi động lại:", error);
          }
        }, 300);
      }
    };

    // Bắt đầu nghe
    recognition.start();

    // =========================
    // CLEAN UP
    // =========================

    return () => {
      shouldListenRef.current = false;

      clearTimeout(transcriptTimerRef.current);
      clearTimeout(warningTimerRef.current);

      try {
        recognition.stop();
      } catch (error) {
        console.log(error);
      }
    };
  }, []);

  return (
    <div className="transcript-box">

      <h3>{status}</h3>

      {/* PHỤ ĐỀ */}
      <div className="subtitle-box">
        {transcript || "🎙️ Hãy bắt đầu bài thuyết trình của bạn..."}
      </div>

      {/* CẢNH BÁO TỪ ĐỆM */}
      {fillerWarning && (
        <div className="filler-warning">
          {fillerWarning}
        </div>
      )}

    </div>
  );
}

export default SpeechRecognition;