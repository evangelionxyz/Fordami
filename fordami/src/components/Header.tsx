import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <div id="header">
      <div id="header-container">
        <div id="header-content">
          <div id="header-left-sequence">
            <div id="h-title" onClick={() => navigate("/")}>
              <h1 id="title">FORDAMI</h1>
            </div>
            <div id="h-subtitle">
              <label id="subtitle">
                Formulir Penggunaan<br></br>Kendaraan Dinas
              </label>
            </div>
          </div>
        </div>

        <div id="header-content">
          <div id="h-admin" onClick={() => navigate("/admin")}>
            <p id="admin">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};
