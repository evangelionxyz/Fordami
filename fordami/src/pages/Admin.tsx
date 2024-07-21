import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CircularPercentage } from "../components/CircularPercentage";
import { VehicleDetailsById, VehicleDetailsByIndex } from "../components/VehicleContext";
import { useVehicles, VehicleProps } from "../components/VehicleContext";
import { useUsers, UserProps } from "../components/UserContext";
import { deleteObject, ref } from "firebase/storage";
import { db, storage } from "../lib/Firebase";
import { uploadImage } from "../components/ImageUpload";
import { ExportToExcel } from "../components/ExportToExcel";
import { checkAdminLoginStatus, getOrCreateComputerId, getPercentageColor} from "../utils";

import{
  collection,
  addDoc,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";

import "../styles/Admin.css";

const getStatusColor = (ready: boolean) => {
  return ready ? "#FFFFFF" : "#222831";
};

const Admin: React.FC = () => {
    const [alertType, setAlertType] = useState("success");
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const showAlertMessage = (msg: string, type: string) => {
        setAlertMessage(msg);
        setAlertType(type);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
    };

    // User =============================
    const [userName, setUserName] = useState("");
    const { users, setUsers } = useUsers();

    const handleUserNameInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setUserName(event.target.value);
    };

    const handleUserAddBt = async (event: React.FormEvent) => {
        event.preventDefault();

        const newUser: UserProps = {
            name: userName,
            id: "",
            vehicleId: "",
        };

        const q = query(collection(db, "users"), where("name", "==", newUser.name));

        const querySnapshot = await getDocs(q);
        const isDuplicate = !querySnapshot.empty;

        if (newUser.name?.trim()) {
            if (isDuplicate) {
                showAlertMessage("Pengguna sudah ada", "danger");
            } else {
                try {
                    const docRef = await addDoc(collection(db, "users"), newUser);
                    updateDoc(docRef, { id: docRef.id });
                    newUser.id = docRef.id;

                    showAlertMessage("Pengguna berhasil ditambahkan", "success");
                    setUserName("");
                } catch (error) {
                    showAlertMessage(
                        "Terjadi kesalahan saat menambahkan pengguna",
                        "warning"
                    );
                }
            }
        }
    };

    const handleUserResetBt = async (
        id: string,
        vehicleId: string,
        event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        try {
            const userDocRef = doc(db, "users", id);
            const vehicleDocRef = doc(db, "vehicles", vehicleId);

            await updateDoc(vehicleDocRef, {
                isReady: true,
                status: "",
                purpose: "",
                returnTime: "",
                timeStamp: "",
            });

            await updateDoc(userDocRef, {
                vehicleId: "",
            });
        } catch (error) {
            console.error("Failed to reset user:", error);
        }
    };

    const handleUserDeleteBt = async (
        id: string,
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();

        try {
            const docRef = doc(db, "users", id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Failed to delete user:", error);
        }
    };

    // Kendaraan =============================
    const [vehicleKind, setVehicleKind] = useState<string>("");
    const [vehicleNumber, setVehicleNumber] = useState<string>("");
    const [bbm, setBbm] = useState(100);
    const [isReady, setIsReady] = useState(true);
    const [p3k, setP3k] = useState(true);
    const [umbrella, setUmbrella] = useState(true);
    const [spareTire, setSpareTire] = useState(true);
    const [jack, setJack] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleUploadBt = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (imageFile) {
            const imageUrl = await uploadImage(imageFile);
            setImageUrl(imageUrl);
        }
    };

    const statusColor = getStatusColor(isReady);
    const percentageColor = getPercentageColor(bbm);
    const { vehicles, setVehicles } = useVehicles();

    const handleP3kChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setP3k(event.target.checked);
    };

    const handleUmbrellaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUmbrella(event.target.checked);
    };

    const handleSpareTireChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSpareTire(event.target.checked);
    };

    const handleJackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setJack(event.target.checked);
    };

    const handleVehicleKindInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setVehicleKind(event.target.value);
    };

    const handleVehicleNumberInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setVehicleNumber(event.target.value);
    };

    const handleBBMPercentageInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        let n = Number(event.target.value);
        n = Math.max(0, Math.min(100, n));
        setBbm(n);
    };

    const handleVehicleAddBt = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!imageFile) {
            showAlertMessage("Silahkan pilih gambar kendaraan", "warning");
            return;
        }

        try {
            const newVehicle: VehicleProps = {
                kind: vehicleKind,
                number: vehicleNumber,
                isReady: true,
                bbm: bbm,
                p3k: p3k,
                umbrella: umbrella,
                spareTire: spareTire,
                jack: jack,
                id: "",
                status: "",
                purpose: "",
                returnTime: "",
                timeStamp: "",
                isoReturnTime: "",
                imageUrl: imageUrl,
            };

            const q = query(
                collection(db, "vehicles"),
                where("kind", "==", newVehicle.kind),
                where("number", "==", newVehicle.number)
            );

            const querySnapshot = await getDocs(q);
            const isDuplicate = !querySnapshot.empty;

            if (newVehicle.kind?.trim() && newVehicle.number?.trim()) {
                if (isDuplicate) {
                    setAlertMessage(
                        "Kendaraan dengan jenis atau nomor yang sama sudah ada"
                    );
                    setAlertType("danger");
                } else {
                    const docRef = await addDoc(collection(db, "vehicles"), newVehicle);
                    updateDoc(docRef, { id: docRef.id });
                    newVehicle.id = docRef.id;

                    showAlertMessage("Kendaraan berhasil ditambahkan", "success");

                    // reset form fields
                    setVehicleKind("");
                    setVehicleNumber("");
                    setBbm(100);
                    setIsReady(true);
                    setP3k(true);
                    setUmbrella(true);
                    setSpareTire(true);
                    setJack(true);

                    setImageFile(null);
                    setImageUrl("");
                }
            }
        } catch (error) {
            showAlertMessage(
                "Terjadi kesalahan saat menambahkan kendaraan",
                "warning"
            );
        }
    };

    const handleVehicleDeleteBt = async (
        id: string,
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();

        try {
            const vehicleDocRef = doc(db, "vehicles", id);
            const vehicleDoc = await getDoc(vehicleDocRef);

            if (vehicleDoc.exists()) {
                const vehicleData = vehicleDoc.data() as VehicleProps;

                if (vehicleData.imageUrl.length > 0) {
                    const imageRef = ref(storage, vehicleData.imageUrl);
                    await deleteObject(imageRef);
                }

                await deleteDoc(vehicleDocRef);
                showAlertMessage("Kendaraan berhasil dihapus", "success");
            }
        } catch (error) {
            showAlertMessage("Gagal mengghasil kendaraan", "danger");
        }
    };

    const [password, setPassword] = useState<string>("");
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
    const [passwordValid, setPasswordValid] = useState<boolean>(false);
    const navigate = useNavigate();



    useEffect(() => {
        const adminStatus = checkAdminLoginStatus();
        setIsAdminLoggedIn(adminStatus);
    }, []);

    const handlePasswordInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    }

    const LOGIN_EXPIRATION_TIME = 5 * 60 * 1000;

    const handleConfirmPassword = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (password) {
            const adminDocRef = doc(db, "admin", "admin");
            const adminDoc = await getDoc(adminDocRef);

            if (adminDoc.exists()) {
                const storedPassword = adminDoc.data().password;
                if (storedPassword === password) {
                    const computerId = getOrCreateComputerId();
                    const expirationTime = Date.now() + LOGIN_EXPIRATION_TIME;
                    localStorage.setItem("adminLoginInfo", JSON.stringify({
                        computerId,
                        expirationTime
                    }));
                    const adminStatus = checkAdminLoginStatus();
                    setIsAdminLoggedIn(adminStatus);
                } else {
                    console.log("wrong password");
                }
            }
        }
    }

    const handleCancelPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        navigate("/");
    }

    return (
        <div>
            <Header />
            {!isAdminLoggedIn ? (
                <div id="admin-form-container">
                    <div id="popup-wrapper">
                        <div id="popup-content">
                            <div className="row">
                                <div id="popup-header">
                                    <label>
                                        <strong>Masuk Sebagai Admin</strong>
                                    </label>
                                    <button
                                        id="popup-close-button"
                                        onClick={(e) => handleCancelPassword(e)}
                                    >
                                        &times;
                                    </button>
                                </div>

                                <div>
                                    <form className="row">
                                        <div className="col-6">
                                            <input type="password" className="form-control" placeholder="Password"
                                                value={password}
                                                onChange={(e) => handlePasswordInputChange(e)}
                                            />
                                        </div>
                                        <div className="col-2">
                                            <button type="submit" className="btn btn-primary"
                                                onClick={(e) => handleConfirmPassword(e)}
                                            >Masuk</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    {showAlert && (
                        <div
                            className={"alert alert-" + alertType + " alert-dismissible"}
                            role="alert"
                            style={{
                                position: "fixed",
                                left: 0,
                                right: 0,
                                zIndex: 1000,
                            }}
                        >
                            {alertMessage}
                        </div>
                    )}
                    <div id="admin-form-container">
                        <div>
                            <form>
                                <div id="admin-user-form">
                                    <div className="row">
                                        <label className="form-label">Isi Nama Pengguna</label>
                                        <input
                                            type="text"
                                            value={userName}
                                            className="form-control"
                                            onChange={handleUserNameInputChange}
                                        ></input>
                                    </div>
                                    <div className="row">
                                        <button
                                            className="btn"
                                            id="button"
                                            onClick={handleUserAddBt}
                                            style={{ backgroundColor: "#00788d" }}
                                        >
                                            Tambah
                                        </button>
                                    </div>

                                    {users.length > 0 && (
                                        <div className="row">
                                            <label className="form-label" style={{ marginTop: "30px" }}>
                                                Daftar Pengguna
                                            </label>
                                            {users.map((user, index) => (
                                                <div className="accordion" id="accordion-listUser">
                                                    <div key={index} className="accordion-item">
                                                        <h2 className="accordion-header">
                                                            <button
                                                                className="accordion-button collapsed"
                                                                type="button"
                                                                key={index}
                                                                data-bs-toggle="collapse"
                                                                data-bs-target={"#user-" + index.toString()}
                                                                aria-expanded="false"
                                                                aria-controls={"user-" + index.toString()}
                                                            >
                                                                {user.name}
                                                            </button>
                                                        </h2>

                                                        <div
                                                            key={index}
                                                            id={"user-" + index.toString()}
                                                            className="accordion-collapse collapse"
                                                            data-bs-parent="#accordion-listUser"
                                                        >
                                                            <div className="accordion-body">
                                                                <div className="row">
                                                                    <div className="row">
                                                                        <div className="col-6">
                                                                            <label style={{ fontSize: "12px" }}>
                                                                                ID
                                                                            </label>
                                                                        </div>
                                                                        <div className="col-6">
                                                                            <label style={{ fontSize: "12px" }}>
                                                                                {user.id}
                                                                            </label>
                                                                        </div>
                                                                    </div>

                                                                    <div className="row mb-3">
                                                                        <div className="col-6">
                                                                            <label>Nama</label>
                                                                        </div>
                                                                        <div className="col-6">
                                                                            <label>{user.name}</label>
                                                                        </div>
                                                                    </div>

                                                                    {user.vehicleId.length > 0 && (
                                                                        <>
                                                                            <div className="row">
                                                                                <label>Detail Penggunaan</label>
                                                                            </div>
                                                                            <VehicleDetailsById vehicleId={user.vehicleId} />
                                                                            <button
                                                                                className="btn"
                                                                                id="button"
                                                                                style={{ backgroundColor: "#00788d" }}
                                                                                onClick={(e) =>
                                                                                    handleUserResetBt(
                                                                                        user.id,
                                                                                        user.vehicleId,
                                                                                        e
                                                                                    )
                                                                                }
                                                                            >
                                                                                Reset
                                                                            </button>
                                                                        </>
                                                                    )}

                                                                    <button
                                                                        className="btn"
                                                                        id="button"
                                                                        style={{ backgroundColor: "#dc3545" }}
                                                                        onClick={(e) => {
                                                                            if (user.vehicleId) {
                                                                                e.preventDefault();
                                                                                showAlertMessage(
                                                                                    "Tidak dapat dihapus, pengguna sedang meminjam",
                                                                                    "danger"
                                                                                );
                                                                            } else {
                                                                                handleUserDeleteBt(user.id, e);
                                                                            }
                                                                        }}
                                                                    >
                                                                        Hapus
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div>
                            <form>
                                <div id="admin-vehicle-form">
                                    <label className="form-label">Jenis Kendaraan</label>
                                    <input
                                        type="text"
                                        value={vehicleKind}
                                        className="form-control"
                                        onChange={handleVehicleKindInputChange}
                                        placeholder="Toyota Kijang"
                                    />

                                    <label className="form-label" style={{ marginTop: "8px" }}>
                                        Nomor Plat
                                    </label>
                                    <input
                                        type="text"
                                        value={vehicleNumber}
                                        className="form-control"
                                        onChange={handleVehicleNumberInputChange}
                                        placeholder="PA 0000 MM"
                                    />

                                    <div
                                        className="row"
                                        style={{ marginTop: "10px", alignItems: "center" }}
                                    >
                                        <div className="col">
                                            <label className="form-label">Jumlah BBM</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={bbm}
                                                min={0}
                                                max={100}
                                                onChange={handleBBMPercentageInputChange}
                                            />
                                        </div>
                                        <div className="col">
                                            <CircularPercentage
                                                color={percentageColor}
                                                bgColor={statusColor}
                                                percentage={bbm}
                                                txtColor={getStatusColor(!isReady)}
                                            >
                                                BBM
                                            </CircularPercentage>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <label className="form-label">Inventaris Kendaraan</label>
                                        <div className="col">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="flexCheckP3K"
                                                    checked={p3k}
                                                    onChange={handleP3kChange}
                                                />
                                                <label className="form-check-label">P3K</label>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="flexCheckUmbrella"
                                                    checked={umbrella}
                                                    onChange={handleUmbrellaChange}
                                                />
                                                <label className="form-check-label">Payung</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="flexCheckSpareTire"
                                                    checked={spareTire}
                                                    onChange={handleSpareTireChange}
                                                />
                                                <label className="form-check-label">Ban Serep</label>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="flexCheckJack"
                                                    checked={jack}
                                                    onChange={handleJackChange}
                                                />
                                                <label className="form-check-label">Dongkrak</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <input
                                            className="form-control mb-2"
                                            type="file"
                                            onChange={(e) => handleFileChange(e)}
                                            accept="image/*"
                                        />
                                        {imageUrl && (
                                            <img
                                                src={imageUrl}
                                                style={{ width: "200px", height: "200px" }}
                                            />
                                        )}
                                    </div>

                                    {imageFile && (
                                        <div className="row">
                                            <button
                                                className="btn"
                                                id="button"
                                                onClick={(e) => handleUploadBt(e)}
                                                style={{ backgroundColor: "#00788d" }}
                                            >
                                                Upload
                                            </button>
                                        </div>
                                    )}

                                    <div className="row">
                                        <button
                                            className="btn"
                                            id="button"
                                            onClick={handleVehicleAddBt}
                                            style={{ backgroundColor: "#00788d" }}
                                        >
                                            Tambah
                                        </button>
                                    </div>

                                    <div className="row" style={{ marginTop: "30px", marginBottom: "4px" }}>
                                        <div className="col">
                                            <label className="form-label">Daftar Kendaraan</label>
                                        </div>
                                        <div className="col" style={{ padding: "0px", alignContent: "center" }}>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    ExportToExcel("vehicles", "vehicles_data");
                                                }}
                                                style={{ border: "none", borderRadius: "4px", margin: "0px" }}
                                            >
                                                Export to Excel
                                            </button>
                                        </div>
                                    </div>

                                    {vehicles.map((vehicle, index) => (
                                        <div className="row">
                                            <div className="accordion" id="accordion-listKendaraan">
                                                <div key={index} className="accordion-item">
                                                    <h2 className="accordion-header">
                                                        <button
                                                            className="accordion-button collapsed"
                                                            type="button"
                                                            data-bs-toggle="collapse"
                                                            data-bs-target={"#vehicle-" + index.toString()}
                                                            aria-expanded="false"
                                                            aria-controls={"vehicle-" + index.toString()}
                                                        >
                                                            {vehicle.kind}
                                                        </button>
                                                    </h2>

                                                    <div
                                                        id={"vehicle-" + index.toString()}
                                                        className="accordion-collapse collapse"
                                                        data-bs-parent="#accordion-listKendaraan"
                                                    >
                                                        <div className="accordion-body">
                                                            <VehicleDetailsByIndex
                                                                idx={index}
                                                            />
                                                            <div className="row">
                                                                <button
                                                                    className="btn"
                                                                    id="button"
                                                                    style={{ backgroundColor: "#dc3545" }}
                                                                    onClick={(e) => {
                                                                        if (!vehicle.isReady) {
                                                                            e.preventDefault();
                                                                            showAlertMessage(
                                                                                "Tidak dapat dihapus, kendaraan sedang digunakan",
                                                                                "danger"
                                                                            );
                                                                        } else {
                                                                            handleVehicleDeleteBt(vehicle.id, e);
                                                                        }
                                                                    }}
                                                                >
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Admin;
