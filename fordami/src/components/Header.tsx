import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "../lib/Firebase";
import settingsIcon from "../assets/settings.svg";

import "../styles/Header.css";

interface HeaderProps {
    admin: boolean;
    loggedIn?: boolean;
    changePWSuccess?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ admin, loggedIn, changePWSuccess }) => {
    const navigate = useNavigate();

    const [openSettings, setOpenSettings] = useState<boolean>(false);
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [failedChangePassword, setFailedChangePassword] = useState<boolean>(false);

    const handleCurrentPWInput = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        event.preventDefault();
        setCurrentPassword(event.target.value);
    }

    const handleNewPWInput = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        event.preventDefault();
        setNewPassword(event.target.value);
    }

    const handleConfirmBt = async (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
        if (currentPassword && newPassword) {
            const adminDocRef = doc(db, "admin", "admin");
            const adminDoc = await getDoc(adminDocRef);

            if (adminDoc.exists()) {
                const storedPassword = adminDoc.data().password;
                if (storedPassword === currentPassword) {
                    await updateDoc(adminDocRef, {
                        password: newPassword
                    })
                    if (changePWSuccess) {
                        changePWSuccess();
                    }
                    localStorage.removeItem("computerId");
                    localStorage.removeItem("adminLoginInfo");
                    setOpenSettings(false);
                    setFailedChangePassword(false);
                } else {
                    setFailedChangePassword(true);
                    setTimeout(() => setFailedChangePassword(false), 3000);
                }
            }
        } else {
            setFailedChangePassword(true);
            setTimeout(() => setFailedChangePassword(false), 3000);
        }
    }

    return (
        <>
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

                    {!admin ? (
                        <div id="header-content">
                            <div id="h-admin" onClick={() => navigate("/admin")}>
                                <p id="admin">Admin</p>
                            </div>
                        </div>
                    ) : admin && loggedIn && (
                        <div id="header-content">
                            <div id="h-admin" onClick={() => setOpenSettings(true)}>
                                    <img src={settingsIcon} alt="settings" style={{
                                        height: "1.8rem",
                                        filter: "invert(1) brightness(100%)"
                                    }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {admin && loggedIn && openSettings && (
                <div id="popup-wrapper">
                    <div id="popup-content">
                        <div className="row">
                            <div id="popup-header">
                                <label>
                                    <strong>Pengaturan</strong>
                                </label>
                                <button
                                    id="popup-close-button"
                                    onClick={(e) => setOpenSettings(false)}
                                >
                                    &times;
                                </button>
                            </div>
                            <div>
                                <div className="row">
                                    <label>Ubah Kata Sandi</label>
                                </div>
                                <div className="row mb-2">
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        className="form-control"
                                        onChange={handleCurrentPWInput}
                                        placeholder="Password saat ini"
                                    />
                                </div>
                                <div className="row">
                                    <input
                                        type="password"
                                        value={newPassword}
                                        className="form-control"
                                        onChange={handleNewPWInput}
                                        placeholder="Password baru"
                                    />
                                </div>

                                <div className="container text-center">
                                    {failedChangePassword && (
                                        <label style={{ color: "#ff3333", fontSize: "14px" }}>
                                            Password tidak valid!
                                        </label>
                                    )}
                                    <div className="row">
                                        <div className="col-6">
                                            <button
                                                className="btn btn-danger"
                                                style={{
                                                    color: "white",
                                                    marginTop: "10px",
                                                    width: "100%"
                                                }}
                                                onClick={(e) => setOpenSettings(false)}
                                            >
                                                Batal
                                            </button>
                                        </div>

                                        <div className="col-6">
                                            <button
                                                className="btn"
                                                style={{
                                                    color: "white",
                                                    marginTop: "10px",
                                                    backgroundColor: "#00788d",
                                                    width: "100%"
                                                }}
                                                onClick={(e) => handleConfirmBt(e)}
                                            >
                                                Konfirmasi
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            )}
        </>
    );
};