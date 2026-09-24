import { Canvas } from "@react-three/fiber";
import { Bounds, useGLTF } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import "../App.css";


/* =========================================================
   NHÂN VẬT SAM
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
   FORMAT THỜI GIAN
   ========================================================= */

function formatTime(totalMinutes) {
  const safeMinutes = Math.max(
    0,
    Number(totalMinutes) || 0
  );

  const totalSeconds = safeMinutes * 60;

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((value) =>
      String(value).padStart(2, "0")
    )
    .join(":");
}


/* =========================================================
   PRACTICE
   ========================================================= */

export default function Practice() {

  const navigate = useNavigate();


  /* =======================================================
     LẤY CHỦ ĐỀ TỪ TOPIC
     ======================================================= */

  const savedTopic =
    localStorage.getItem(
      "presentationTopic"
    ) || "";


  /* =======================================================
     LẤY THỜI GIAN TỪ TOPIC
     ======================================================= */

  const savedMinutes =
    Number(
      localStorage.getItem(
        "presentationMinutes"
      )
    ) || 5;


  /* =======================================================
     BẮT ĐẦU THUYẾT TRÌNH
     ======================================================= */

  const handleStart = () => {

    /*
      Không chạy timer ở Practice.

      Khi bấm SẴN SÀNG,
      chuyển thẳng sang Presentation.

      Presentation sẽ tự lấy:
      - presentationTopic
      - presentationMinutes
    */

    navigate("/presentation");
  };


  return (
    <div className="practice-page">


      {/* ===================================================
          LOGO
          =================================================== */}

      <div className="practice-logo">
        FEAR2HEAR
      </div>


      {/* ===================================================
          TIMER
          =================================================== */}

      <div className="practice-timer-box">

        <div className="practice-clock-icon">
          ◷
        </div>

        <div className="practice-timer">
          {formatTime(savedMinutes)}
        </div>

      </div>


      {/* ===================================================
          SAM
          =================================================== */}

      <div className="practice-sam-container">

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
          CÂU HỎI
          =================================================== */}

      <div className="practice-ready-text">
        Bạn đã sẵn sàng chưa?
      </div>


      {/* ===================================================
          NÚT SẴN SÀNG
          =================================================== */}

      <button
        className="practice-ready-btn"
        onClick={handleStart}
      >
        SẴN SÀNG
      </button>


    </div>
  );
}