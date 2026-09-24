import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // MẬT KHẨU:
  // - Tối thiểu 6 ký tự
  // - Tối đa 16 ký tự
  // - Ít nhất 1 chữ cái
  // - Ít nhất 1 số
  // - Ít nhất 1 ký tự đặc biệt
  // =====================================================

  const passwordValid =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,16}$/.test(password);

  // =====================================================
  // ĐĂNG KÝ
  // =====================================================

  const handleSubmit = async () => {
    setSubmitted(true);
    setFirebaseError("");

    // KIỂM TRA FORM
    if (!email || !username || !passwordValid || !confirmPassword) {
      return;
    }

    // KIỂM TRA MẬT KHẨU NHẬP LẠI
    if (confirmPassword !== password) {
      return;
    }

    try {
      setLoading(true);

      // TẠO TÀI KHOẢN TRÊN FIREBASE
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // LƯU TÊN TÀI KHOẢN
      await updateProfile(userCredential.user, {
        displayName: username.trim(),
      });

      console.log("Đăng ký thành công:", userCredential.user);

      // ĐĂNG KÝ THÀNH CÔNG → LOGIN
      navigate("/login");
    } catch (error) {
      console.error("Lỗi đăng ký:", error);

      // EMAIL ĐÃ TỒN TẠI
      if (error.code === "auth/email-already-in-use") {
        setFirebaseError("Email này đã được đăng ký.");
      }

      // EMAIL KHÔNG HỢP LỆ
      else if (error.code === "auth/invalid-email") {
        setFirebaseError("Địa chỉ email không hợp lệ.");
      }

      // MẬT KHẨU KHÔNG ĐẠT YÊU CẦU
      else if (error.code === "auth/weak-password") {
        setFirebaseError("Mật khẩu không đủ mạnh.");
      }

      // FIREBASE CHƯA CHO PHÉP EMAIL/PASSWORD
      else if (error.code === "auth/operation-not-allowed") {
        setFirebaseError(
          "Phương thức đăng ký Email/Password chưa được bật trong Firebase."
        );
      }

      // LỖI KHÁC
      else {
        setFirebaseError(
          `Đăng ký thất bại: ${error.code || "Lỗi không xác định"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-wave-lines"></div>

      <div className="register-logo">
        FEAR2HEAR
      </div>

      <div className="register-wave register-wave-top"></div>
      <div className="register-wave register-wave-bottom"></div>

      <div className="register-box">

        {/* AVATAR */}
        <div className="register-avatar">
          <div className="avatar-head"></div>
          <div className="avatar-body"></div>
        </div>


        {/* EMAIL */}
        <input
          type="email"
          className={`register-input ${
            submitted && !email ? "input-error" : ""
          }`}
          placeholder="ĐỊA CHỈ EMAIL"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFirebaseError("");
          }}
        />


        {/* TÊN TÀI KHOẢN */}
        <input
          type="text"
          className={`register-input ${
            submitted && !username ? "input-error" : ""
          }`}
          placeholder="TÊN TÀI KHOẢN"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setFirebaseError("");
          }}
        />


        {/* MẬT KHẨU */}
        <div className="password-wrapper">

          <input
            type={showPassword ? "text" : "password"}
            className={`register-input ${
              submitted && !passwordValid ? "input-error" : ""
            }`}
            placeholder="MẬT KHẨU (chữ cái, số, ký tự đặc biệt, 6-16 ký tự)"
            maxLength={16}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFirebaseError("");
            }}
          />

          <button
            type="button"
            className="eye-button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "◉" : "◯"}
          </button>

        </div>


        {/* NHẬP LẠI MẬT KHẨU */}
        <div className="password-wrapper">

          <input
            type={showConfirmPassword ? "text" : "password"}
            className={`register-input ${
              submitted &&
              (!confirmPassword || confirmPassword !== password)
                ? "input-error"
                : ""
            }`}
            placeholder="NHẬP LẠI MẬT KHẨU"
            maxLength={16}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFirebaseError("");
            }}
          />

          <button
            type="button"
            className="eye-button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
          >
            {showConfirmPassword ? "◉" : "◯"}
          </button>

        </div>


        {/* THÔNG BÁO LỖI */}
        {firebaseError && (
          <div className="register-error-message">
            {firebaseError}
          </div>
        )}


        {/* TẠO TÀI KHOẢN */}
        <button
          type="button"
          className="register-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "ĐANG TẠO..." : "TẠO TÀI KHOẢN"}
        </button>


        {/* ĐÃ CÓ TÀI KHOẢN */}
        <button
          type="button"
          className="login-button"
          onClick={() => navigate("/login")}
        >
          ĐÃ CÓ TÀI KHOẢN
        </button>

      </div>
    </div>
  );
}