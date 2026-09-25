import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function SamQuestions() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // PRODUCTION API
  // =========================================================
  const API_URL = "https://fear2hear.onrender.com";

  // =========================================================
  // LẤY DỮ LIỆU BÀI THUYẾT TRÌNH
  // =========================================================
  const getPresentationData = () => {
    const topic =
      localStorage.getItem("presentationTopic") || "";

    const transcript =
      localStorage.getItem("presentationTranscript") || "";

    return {
      topic: topic.trim(),
      transcript: transcript.trim(),
    };
  };

  // =========================================================
  // GỌI AI TẠO CÂU HỎI
  // =========================================================
  const handleReady = async () => {
    console.log("========== SAM START ==========");

    setError("");

    const { topic, transcript } = getPresentationData();

    console.log("📌 API URL:", API_URL);
    console.log("📌 Topic:", topic);
    console.log("📌 Transcript:", transcript);
    console.log("📌 Transcript length:", transcript.length);

    // -------------------------------------------------------
    // KIỂM TRA DỮ LIỆU
    // -------------------------------------------------------

    if (!topic) {
      console.error("❌ Không có presentationTopic");

      setError(
        "Chưa có chủ đề bài thuyết trình."
      );

      return;
    }

    if (!transcript) {
      console.error("❌ Không có presentationTranscript");

      setError(
        "Chưa có nội dung bài thuyết trình. Hãy kiểm tra lại phần ghi âm."
      );

      return;
    }

    setLoading(true);

    try {
      // -----------------------------------------------------
      // GỌI SERVER RENDER
      // -----------------------------------------------------

      const endpoint =
        `${API_URL}/api/generate-questions`;

      console.log("🚀 ĐANG GỌI SERVER:");
      console.log(endpoint);

      const response = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          topic,
          transcript,
        }),
      });

      console.log(
        "📡 Server status:",
        response.status
      );

      console.log(
        "📡 Server OK:",
        response.ok
      );

      // -----------------------------------------------------
      // ĐỌC RESPONSE AN TOÀN
      // -----------------------------------------------------

      const responseText =
        await response.text();

      console.log(
        "📥 RAW SERVER RESPONSE:",
        responseText
      );

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (jsonError) {
        console.error(
          "❌ Không parse được JSON:",
          jsonError
        );

        throw new Error(
          `Server trả về dữ liệu không hợp lệ. HTTP ${response.status}`
        );
      }

      console.log(
        "📥 SERVER DATA:",
        data
      );

      // -----------------------------------------------------
      // SERVER BÁO LỖI
      // -----------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.error ||
          `Server trả về lỗi HTTP ${response.status}`
        );
      }

      // -----------------------------------------------------
      // KIỂM TRA DANH SÁCH CÂU HỎI
      // -----------------------------------------------------

      if (!Array.isArray(data.questions)) {
        throw new Error(
          "Server không trả về danh sách câu hỏi."
        );
      }

      if (data.questions.length !== 4) {
        throw new Error(
          `AI chỉ trả về ${data.questions.length} câu hỏi thay vì 4 câu.`
        );
      }

      // -----------------------------------------------------
      // LƯU CÂU HỎI
      // -----------------------------------------------------

      const questions =
        data.questions
          .slice(0, 4)
          .map((question) =>
            String(question).trim()
          )
          .filter(Boolean);

      if (questions.length !== 4) {
        throw new Error(
          "Danh sách câu hỏi AI trả về không hợp lệ."
        );
      }

      console.log(
        "✅ 4 CÂU HỎI AI:",
        questions
      );

      // -----------------------------------------------------
      // TẠO ID CHO LẦN LUYỆN
      // -----------------------------------------------------

      const attemptId =
        `attempt_${Date.now()}`;

      // -----------------------------------------------------
      // LƯU LOCAL STORAGE
      // -----------------------------------------------------

      localStorage.setItem(
        "practiceAttemptId",
        attemptId
      );

      localStorage.setItem(
        "samQuestions",
        JSON.stringify(questions)
      );

      localStorage.setItem(
        "samAnswers",
        JSON.stringify(
          questions.map(() => null)
        )
      );

      console.log(
        "💾 Đã lưu practiceAttemptId:",
        attemptId
      );

      console.log(
        "💾 Đã lưu samQuestions"
      );

      console.log(
        "💾 Đã lưu samAnswers"
      );

      // -----------------------------------------------------
      // ĐI SANG SAM DEBATE
      // -----------------------------------------------------

      console.log(
        "➡️ Chuyển sang /sam-debate"
      );

      navigate("/sam-debate");

    } catch (err) {
      console.error(
        "❌ GENERATE QUESTIONS ERROR:"
      );

      console.error(
        "Message:",
        err?.message
      );

      console.error(
        "Full error:",
        err
      );

      // -----------------------------------------------------
      // LỖI KẾT NỐI
      // -----------------------------------------------------

      if (
        err instanceof TypeError &&
        err?.message === "Failed to fetch"
      ) {
        setError(
          "Không kết nối được với AI server. Hãy kiểm tra kết nối mạng hoặc server Render."
        );
      } else {
        setError(
          err?.message ||
          "Không thể tạo câu hỏi AI lúc này."
        );
      }

    } finally {
      setLoading(false);

      console.log(
        "========== SAM END =========="
      );
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="sam-questions-page">

      <div className="sam-questions-card">

        <h1>
          SAM
        </h1>

        <p>
          AI đã sẵn sàng đặt câu hỏi cho
          bài thuyết trình của bạn.
        </p>

        {error && (
          <div className="sam-error">
            {error}
          </div>
        )}

        <button
          className="sam-ready-btn"
          onClick={handleReady}
          disabled={loading}
        >
          {loading
            ? "AI đang suy nghĩ..."
            : "Sẵn sàng"}
        </button>

      </div>

    </div>
  );
}