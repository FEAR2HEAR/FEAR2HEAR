import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Bounds, useGLTF } from "@react-three/drei";
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
   MAIN PAGE
   ========================================================= */

export default function MainPage() {
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="main-page">

      {/* ================= LOGO + NGÀY ================= */}

      <div className="main-brand">

        <div className="main-logo">
          FEAR2HEAR
        </div>

        <div className="main-date">
          {today}
        </div>

      </div>


      {/* ================= NÚT LỊCH SỬ ================= */}

      <button
        className="main-history-btn"
        onClick={() => navigate("/history")}
        style={{
          position: "absolute",
          top: "28px",
          right: "35px",
          zIndex: 20,
        }}
      >
        LỊCH SỬ LUYỆN TẬP
      </button>


      {/* ================= KHU VỰC TRUNG TÂM ================= */}

      <main className="main-center">

        {/* ================= SAM ================= */}

        <div className="sam-container">

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

            {/* ÁNH SÁNG */}

            <ambientLight intensity={1.25} />

            <directionalLight
              position={[4, 5, 6]}
              intensity={1.2}
            />

            <directionalLight
              position={[-4, 2, 4]}
              intensity={0.45}
            />

            {/* CĂN TOÀN BỘ NHÂN VẬT */}

            <Bounds
              fit
              margin={1.55}
            >
              <SamModel />
            </Bounds>

          </Canvas>

        </div>


        {/* ================= SLOGAN ================= */}

        <div className="main-slogan">
          From Fear to Be Heard
        </div>


        {/* ================= BUTTON BẮT ĐẦU ================= */}

        <div className="main-buttons">

          <button
            className="main-start-btn"
            onClick={() => navigate("/topic")}
          >
            BẮT ĐẦU
          </button>

        </div>

      </main>

    </div>
  );
}