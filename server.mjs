import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3001;
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    "❌ Không tìm thấy GEMINI_API_KEY trong biến môi trường."
  );

  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
});

const MODEL = "gemini-3.6-flash";

console.log(
  `FEAR2HEAR AI server đang chạy tại http://localhost:${PORT}`
);

console.log(`🤖 Gemini model: ${MODEL}`);

/* =========================================================
   REQUEST LOG
========================================================= */

app.use((req, res, next) => {
  console.log(
    `📡 ${req.method} ${req.originalUrl}`
  );

  next();
});

/* =========================================================
   HELPER
========================================================= */

function parseJson(text) {
  if (!text) {
    throw new Error(
      "Gemini không trả về nội dung."
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error(
        "Gemini trả về dữ liệu không đúng định dạng JSON."
      );
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isDailyQuotaError(error) {
  const message = String(
    error?.message || ""
  );

  let raw = "";

  try {
    raw = JSON.stringify(error);
  } catch {
    raw = "";
  }

  const text =
    `${message} ${raw}`.toLowerCase();

  return (
    text.includes(
      "generaterequestsperday"
    ) ||
    text.includes(
      "perdayperprojectpermodel"
    ) ||
    text.includes("daily quota") ||
    text.includes("quota_exceeded") ||
    (
      text.includes("quota exceeded") &&
      text.includes("perday")
    )
  );
}

function getRetrySeconds(error) {
  const message = String(
    error?.message || ""
  );

  const retryDelayMatch =
    message.match(
      /retryDelay["']?\s*:\s*["']?([\d.]+)s/i
    );

  if (retryDelayMatch) {
    return Math.ceil(
      Number(retryDelayMatch[1])
    );
  }

  const retryInMatch =
    message.match(
      /retry in\s+([\d.]+)s/i
    );

  if (retryInMatch) {
    return Math.ceil(
      Number(retryInMatch[1])
    );
  }

  return null;
}

function getErrorStatus(error) {
  return (
    error?.status ||
    error?.code ||
    error?.error?.code ||
    null
  );
}

/* =========================================================
   GEMINI
========================================================= */

async function generateWithRetry(prompt) {
  const MAX_RETRIES = 4;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      console.log(
        `🤖 Gọi Gemini... lần ${attempt}/${MAX_RETRIES}`
      );

      const response =
        await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: {
            responseMimeType:
              "application/json",
            temperature: 0.7,
          },
        });

      console.log(
        "✅ Gemini trả kết quả."
      );

      return response;
    } catch (error) {
      const status =
        getErrorStatus(error);

      console.error(
        `❌ Gemini error lần ${attempt}:`,
        error?.message || error
      );

      if (
        status === 429 &&
        isDailyQuotaError(error)
      ) {
        const quotaError =
          new Error(
            "Gemini đã hết lượt sử dụng miễn phí hôm nay."
          );

        quotaError.code =
          "DAILY_QUOTA_EXCEEDED";

        throw quotaError;
      }

      const isTemporaryServerError =
        status === 503 ||
        status === 408 ||
        (
          typeof status === "number" &&
          status >= 500 &&
          status < 600
        );

      const isTemporaryRateLimit =
        status === 429 &&
        !isDailyQuotaError(error);

      const shouldRetry =
        isTemporaryServerError ||
        isTemporaryRateLimit;

      if (
        !shouldRetry ||
        attempt === MAX_RETRIES
      ) {
        throw error;
      }

      let waitTime;

      const retrySeconds =
        getRetrySeconds(error);

      if (retrySeconds) {
        waitTime =
          retrySeconds * 1000;
      } else {
        waitTime =
          3000 *
          Math.pow(2, attempt - 1);
      }

      const jitter =
        Math.floor(
          Math.random() * 1000
        );

      waitTime += jitter;

      console.log(
        `⏳ Gemini đang bận. Thử lại sau ${Math.ceil(
          waitTime / 1000
        )} giây...`
      );

      await sleep(waitTime);
    }
  }

  throw new Error(
    "Gemini không phản hồi sau nhiều lần thử."
  );
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "FEAR2HEAR AI server đang hoạt động.",
    model: MODEL,
  });
});

app.get("/api/test", (req, res) => {
  console.log(
    "✅ /api/test được gọi."
  );

  res.json({
    success: true,
    message:
      "FEAR2HEAR AI server đang hoạt động.",
    model: MODEL,
  });
});

/* =========================================================
   GENERATE QUESTIONS
========================================================= */

app.post(
  "/api/generate-questions",
  async (req, res) => {
    console.log(
      "========== GENERATE QUESTIONS =========="
    );

    try {
      const {
        topic,
        transcript,
      } = req.body;

      console.log(
        "📌 Topic:",
        topic
      );

      console.log(
        "📌 Transcript length:",
        transcript?.length || 0
      );

      if (!topic) {
        return res.status(400).json({
          error:
            "Thiếu chủ đề bài thuyết trình.",
        });
      }

      if (!transcript) {
        return res.status(400).json({
          error:
            "Thiếu nội dung bài thuyết trình.",
        });
      }

      const prompt = `
Bạn là SAM, một AI đóng vai người phản biện
trong nền tảng luyện tập thuyết trình FEAR2HEAR.

NHIỆM VỤ:

Dựa trên chủ đề và nội dung bài thuyết trình
của người dùng, hãy tạo chính xác 4 câu hỏi
phản biện bằng tiếng Việt.

CHỦ ĐỀ:
${topic}

NỘI DUNG BÀI THUYẾT TRÌNH:
${transcript}

YÊU CẦU:

1. Tạo đúng 4 câu hỏi.
2. Câu hỏi phải dựa trực tiếp vào nội dung người
   dùng đã trình bày.
3. Không hỏi những câu quá chung chung.
4. Không lặp lại cùng một ý tưởng.
5. Độ khó tăng dần:
   - Câu 1: kiểm tra mức độ hiểu và làm rõ nội dung.
   - Câu 2: yêu cầu giải thích hoặc chứng minh.
   - Câu 3: đặt người trình bày trước một vấn đề,
     hạn chế hoặc trường hợp khác.
   - Câu 4: câu hỏi phản biện sâu hơn, yêu cầu
     suy luận hoặc bảo vệ quan điểm.
6. Câu hỏi phải tự nhiên như một người thật đang
   chất vấn sau bài thuyết trình.
7. Không đưa đáp án.
8. Không đánh số trong nội dung câu hỏi.
9. Chỉ trả về JSON.

FORMAT BẮT BUỘC:

{
  "questions": [
    "Câu hỏi 1",
    "Câu hỏi 2",
    "Câu hỏi 3",
    "Câu hỏi 4"
  ]
}
`;

      const response =
        await generateWithRetry(
          prompt
        );

      const text =
        response.text || "";

      console.log(
        "📥 Gemini response:",
        text
      );

      const data =
        parseJson(text);

      if (
        !data.questions ||
        !Array.isArray(
          data.questions
        )
      ) {
        throw new Error(
          "Gemini không trả về danh sách câu hỏi hợp lệ."
        );
      }

      const questions =
        data.questions
          .map((question) =>
            String(question).trim()
          )
          .filter(Boolean)
          .slice(0, 4);

      if (questions.length < 4) {
        throw new Error(
          "Gemini chưa tạo đủ 4 câu hỏi."
        );
      }

      console.log(
        "✅ QUESTIONS:",
        questions
      );

      return res.json({
        questions,
      });
    } catch (error) {
      console.error(
        "❌ Generate questions error:",
        error
      );

      if (
        error?.code ===
        "DAILY_QUOTA_EXCEEDED"
      ) {
        return res.status(429).json({
          error:
            "Gemini đã hết lượt miễn phí hôm nay. Bà chờ quota reset rồi thử lại nha.",
        });
      }

      const status =
        getErrorStatus(error);

      if (
        status === 503 ||
        (
          typeof status === "number" &&
          status >= 500 &&
          status < 600
        )
      ) {
        return res.status(503).json({
          error:
            "Gemini đang quá tải tạm thời. Bà thử lại sau một chút nha.",
        });
      }

      if (status === 429) {
        return res.status(429).json({
          error:
            "Gemini đang giới hạn số lượt gọi tạm thời. Bà thử lại sau một chút nha.",
        });
      }

      return res.status(500).json({
        error:
          error?.message ||
          "Không thể tạo câu hỏi AI.",
      });
    } finally {
      console.log(
        "========== END QUESTIONS =========="
      );
    }
  }
);

/* =========================================================
   GENERATE FEEDBACK
========================================================= */

app.post(
  "/api/generate-feedback",
  async (req, res) => {
    console.log(
      "========== GENERATE FEEDBACK =========="
    );

    try {
      const {
        topic,
        transcript,
        questions,
        answers,
        presentationPerformanceMetrics,
        samPerformanceMetrics,
      } = req.body;

      if (!topic) {
        return res.status(400).json({
          error:
            "Thiếu chủ đề bài thuyết trình.",
        });
      }

      if (!transcript) {
        return res.status(400).json({
          error:
            "Thiếu nội dung bài thuyết trình.",
        });
      }

      const prompt = `
Bạn là SAM, AI hỗ trợ luyện tập thuyết trình
của FEAR2HEAR.

Hãy đánh giá toàn bộ phần luyện tập của người dùng
và đưa ra nhận xét ngắn gọn, cụ thể, mang tính
xây dựng.

THÔNG TIN BÀI THUYẾT TRÌNH
==========================

CHỦ ĐỀ:
${topic}

TRANSCRIPT:
${transcript}

CÂU HỎI CỦA SAM
================

${JSON.stringify(
  questions || [],
  null,
  2
)}

CÂU TRẢ LỜI CỦA NGƯỜI DÙNG
===========================

${JSON.stringify(
  answers || [],
  null,
  2
)}

HIỆU SUẤT KHI THUYẾT TRÌNH
===========================

${JSON.stringify(
  presentationPerformanceMetrics || {},
  null,
  2
)}

HIỆU SUẤT KHI TRẢ LỜI SAM
==========================

${JSON.stringify(
  samPerformanceMetrics || {},
  null,
  2
)}

YÊU CẦU ĐÁNH GIÁ
================

Hãy tập trung vào:

1. Điểm mạnh:
   - Nội dung
   - Cách trình bày
   - Khả năng trả lời
   - Điểm tích cực nổi bật

2. Điểm yếu:
   - Những vấn đề cụ thể cần cải thiện
   - Không được nhận xét chung chung

3. Gợi ý luyện tập:
   - Đưa ra những hành động cụ thể mà người dùng
     có thể thực hiện trong lần luyện tập tiếp theo.

LƯU Ý:

- Nhận xét dựa trên dữ liệu thực tế được cung cấp.
- Không bịa thêm thông tin.
- Không nhận xét tiêu cực một cách nặng nề.
- Không dùng ngôn ngữ quá học thuật.
- Viết bằng tiếng Việt tự nhiên.
- Mỗi phần nên ngắn gọn nhưng hữu ích.
- Không chấm điểm nếu không có yêu cầu.
- Chỉ trả về JSON.

FORMAT BẮT BUỘC:

{
  "strength": "Nhận xét về điểm mạnh",
  "weakness": "Nhận xét về điểm yếu",
  "suggestion": "Gợi ý luyện tập"
}
`;

      const response =
        await generateWithRetry(
          prompt
        );

      const text =
        response.text || "";

      const data =
        parseJson(text);

      return res.json({
        strength:
          data.strength ||
          "Không có nhận xét.",
        weakness:
          data.weakness ||
          "Không có nhận xét.",
        suggestion:
          data.suggestion ||
          "Hãy tiếp tục luyện tập để cải thiện.",
      });
    } catch (error) {
      console.error(
        "❌ Generate feedback error:",
        error
      );

      if (
        error?.code ===
        "DAILY_QUOTA_EXCEEDED"
      ) {
        return res.status(429).json({
          error:
            "Gemini đã hết lượt miễn phí hôm nay. Bà chờ quota reset rồi thử lại nha.",
        });
      }

      const status =
        getErrorStatus(error);

      if (
        status === 503 ||
        (
          typeof status === "number" &&
          status >= 500 &&
          status < 600
        )
      ) {
        return res.status(503).json({
          error:
            "Gemini đang quá tải tạm thời. Bà thử lại sau một chút nha.",
        });
      }

      if (status === 429) {
        return res.status(429).json({
          error:
            "Gemini đang giới hạn số lượt gọi tạm thời. Bà thử lại sau một chút nha.",
        });
      }

      return res.status(500).json({
        error:
          error?.message ||
          "Không thể tạo feedback AI.",
      });
    } finally {
      console.log(
        "========== END FEEDBACK =========="
      );
    }
  }
);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  console.log(
    `❌ 404 API không tồn tại: ${req.method} ${req.originalUrl}`
  );

  res.status(404).json({
    error: "API không tồn tại.",
  });
});

/* =========================================================
   GLOBAL ERROR
========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ Global server error:",
      error
    );

    res.status(500).json({
      error:
        error?.message ||
        "Lỗi server.",
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `🚀 FEAR2HEAR AI server đang chạy tại port ${PORT}`
    );

    console.log(
      `🤖 Gemini model: ${MODEL}`
    );

    console.log(
      `🔑 GEMINI_API_KEY: ${
        apiKey
          ? "ĐÃ CÓ"
          : "KHÔNG CÓ"
      }`
    );
  }
);