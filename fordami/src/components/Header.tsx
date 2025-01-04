import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getDoc,
    getDocs,
    doc, 
    updateDoc,
    deleteDoc,
    collection, 
    addDoc,
    where,
    query }
from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage} from "../lib/Firebase";
import { QueueDetails, useQueues, QueueProps } from "./QueueContext";
import { getUserById } from "./UserContext";
import { getTimestamp, formatDateTime } from "../utils";
import { getVehicleById } from "./VehicleContext";
import "../styles/Header.css";

interface HeaderProps {
    admin: boolean;
    loggedIn?: boolean;
    onConfirmQueue?: () => void;
    onChangePWSuccess?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ admin, loggedIn, onConfirmQueue, onChangePWSuccess }) => {
    const navigate = useNavigate();

    const [openSettings, setOpenSettings] = useState<boolean>(false);
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [failedChangePassword, setFailedChangePassword] = useState<boolean>(false);
    const [settingsIconUrl, setSettingsIconUrl] = useState<string>("");
    const [queueIconUrl, setQueueIconUrl] = useState<string>("");
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const { queues } = useQueues();

    useEffect(() => {
        const fetchIconUrl = async () => {
            try {
                const settingsIconRef = ref(storage, "settings.svg");
                const settingsUrl = await getDownloadURL(settingsIconRef);
                setSettingsIconUrl(settingsUrl);

                const queueIconRef = ref(storage, "envelope.svg");
                const queueUrl = await getDownloadURL(queueIconRef);
                setQueueIconUrl(queueUrl);

                setImageLoaded(true);
            } catch (err) {
                console.error("Error fetching icon URL: ", err);
            }
        };

        fetchIconUrl();
    }, []);

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
                    
                    localStorage.removeItem("computerId");
                    localStorage.removeItem("adminLoginInfo");
                    setOpenSettings(false);
                    setFailedChangePassword(false);

                    if (onChangePWSuccess) {
                        onChangePWSuccess();
                    }

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

    const handleQueueDeniedBt = async (
        queue: QueueProps,
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
        try {
            // reset vehicle's data
            const vehicleDocRef = doc(db, "vehicles", queue.vehicleId);
            await updateDoc(vehicleDocRef, {
                isBooked: false
            });

            // remove queue
            const docRef = doc(db, "queue", queue.id);
            await deleteDoc(docRef);
        } catch(error) {
            console.log("Failed to delete queue:", error);
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
                                    Formulir Penggunaan<br></br>Kendaraan Dinas Mimika
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
                    ) : admin && (
                        <div id="header-content">
                            <div id="h-admin">
                                {imageLoaded && (
                                    <>
                                        <img src={settingsIconUrl} alt="settings" id="imgBt"
                                            onClick={() => {
                                                if (loggedIn) {
                                                    setOpenSettings(true);
                                                }
                                            }}
                                        />
                                    </>
                                )}
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
                                    onClick={(e) => setOpenSettings(false)}>
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