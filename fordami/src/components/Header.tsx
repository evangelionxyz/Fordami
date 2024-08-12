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

interface HistoryProps {
    userName: string,
    vehicleName: string,
    vehicleNumber: string,
    purpose: string,
    returnDateTime: string,
    dateTime: string,
    id: string,
};

interface HeaderProps {
    admin: boolean;
    loggedIn?: boolean;
    changePWSuccess?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ admin, loggedIn, changePWSuccess }) => {
    const navigate = useNavigate();

    const [openSettings, setOpenSettings] = useState<boolean>(false);
    const [openQueue, setOpenQueue] = useState<boolean>(false);
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

    const handleQueueConfirmBt = async (
        queue: QueueProps,
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
        try {
            const user = await getUserById(queue.userId);
            const vehicle = await getVehicleById(queue.vehicleId);

            if(user && vehicle) {
                if(vehicle.isReady) {
                    const vehicleDocRef = doc(db, "vehicles", queue.vehicleId);
                    await updateDoc(vehicleDocRef, {
                        isReady: false,
                        isBooked: false,
                        status: "Sedang digunakan oleh " + user.name,
                        timeStamp: getTimestamp(),
                    })
                    
                    const newHistory: HistoryProps = {
                        userName: user.name,
                        vehicleName: vehicle.kind,
                        vehicleNumber: vehicle.number,
                        purpose: vehicle.purpose,
                        returnDateTime: formatDateTime(vehicle.returnDateTime),
                        dateTime: getTimestamp(),
                        id: "",
                    }

                    const historyDocRef = await addDoc(collection(db, "history"), newHistory);
                    updateDoc(historyDocRef, {id: historyDocRef.id});
                    newHistory.id = historyDocRef.id;
                    user.borrowId = historyDocRef.id;

                    const userDocRef = doc(db, "users", user.id);
                    await updateDoc(userDocRef, {
                        vehicleId: vehicle.id,
                        borrowId: historyDocRef.id
                    });

                    // remove queue
                    const docRef = doc(db, "queue", queue.id);
                    await deleteDoc(docRef);

                    // remove all queue with same vehicle id
                    const queueQuery = query(collection(db, "queue"), where("vehicleId", "==", vehicle.id));
                    const queueQuerySnapshot = await getDocs(queueQuery);
                    queueQuerySnapshot.forEach(async (doc) => {
                        await deleteDoc(doc.ref);
                    });
                }
            }
        } catch(error) {
            console.log("Error failed to confirm queue:", error);
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
                                        <img src={queueIconUrl} alt="queue" id="imgBt"
                                            onClick={() => {
                                                if (loggedIn) {
                                                    setOpenQueue(true);
                                                    if(openSettings) {
                                                        setOpenSettings(false);
                                                    }
                                                }
                                            }}
                                        />
                                        
                                        <img src={settingsIconUrl} alt="settings" id="imgBt"
                                            onClick={() => {
                                                if (loggedIn) {
                                                    setOpenSettings(true);
                                                    if(openQueue) {
                                                        setOpenQueue(false);
                                                    }
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

            {admin && loggedIn && openQueue && (
                <div id="popup-wrapper">
                    <div id="popup-content">
                        <div className="row">
                            <div id="popup-header">
                                <label>
                                    <strong>Daftar Pinjaman Kendaraan</strong>
                                </label>
                                <button
                                    id="popup-close-button"
                                    onClick={(e) => setOpenQueue(false)}>
                                    &times;
                                </button>
                            </div>
                            <div>
                                <div className="row">
                                    {queues.length > 0 ? (
                                        queues.map((item, index) => (
                                        <>
                                        <QueueDetails 
                                            userId={item.userId}
                                            vehicleId={item.vehicleId}
                                        />
                                        <div className="col-6">
                                            <button
                                                className="btn btn-danger"
                                                style={{
                                                    color: "white",
                                                    marginTop: "10px",
                                                    width: "100%"
                                                }}
                                                onClick={(e) => handleQueueDeniedBt(item, e)}>
                                                Hapus
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
                                                onClick={(e) => handleQueueConfirmBt(item, e)}
                                            >
                                                Konfirmasi
                                            </button>
                                        </div>
                                        </>))
                                    ) : (
                                        <div>Belum ada daftar</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

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