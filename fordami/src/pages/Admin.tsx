import {
    VehicleDetailsById,
    VehicleDetailsByIndex,
    useVehiclesStatusCheck
} from "../components/VehicleContext";
import {
    checkAdminLoginStatus,
    getOrCreateComputerId,
    getPercentageColor
} from "../utils";

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
import React, { useState, useEffect, useRef } from "react";
import { useFetcher, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CircularPercentage } from "../components/CircularPercentage";
import { useVehicles, VehicleProps } from "../components/VehicleContext";
import { useUsers, UserProps } from "../components/UserContext";
import { getStorage, deleteObject, ref, getMetadata } from "firebase/storage";
import { db, storage } from "../lib/Firebase";
import { uploadImage } from "../components/ImageUpload";
import { ExportToExcel } from "../components/ExportToExcel";
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
        event.preventDefault();
        setUserName(event.target.value);
    };

    const handleUserAddBt = async (event: React.FormEvent) => {
        event.preventDefault();

        const newUser: UserProps = {
            name: userName,
            borrowId: "",
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
        borrowId: string,
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
                resetTime: null,
                timeStamp: "",
                returnDateTime: "",

            });

            await updateDoc(userDocRef, {
                vehicleId: "",
            });

            const historyCollectionRef = collection(db, "history");
            const q = query(historyCollectionRef, where("id", "==", borrowId));
            const querySnapshot = await getDocs(q);

            const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
            await Promise.all(deletePromises);
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
    const [inventoryItems, setInventoryItems] = useState<string[]>(["Payung", "P3K", "Dongkrak", "Ban Serep"]);
    const [newInventory, setNewInventory] = useState<string>("");
    const [bbm, setBbm] = useState(100);
    const [isReady, setIsReady] = useState(true);
    const imageFileRef = useRef<HTMLInputElement>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string>("");

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        if (e.target.files) {
            const selectedImage = e.target.files[0];
            setImageFile(selectedImage);
            const newImage = await uploadImage(selectedImage);
            setImageUrl(newImage);
            showAlertMessage("Gambar berhasil diupload", "success");
        }
    };

    const statusColor = getStatusColor(isReady);
    const percentageColor = getPercentageColor(bbm);
    const { vehicles } = useVehicles();
    useVehiclesStatusCheck(vehicles);

    const handleInventoryDeleteBt =(
        event: React.MouseEvent<HTMLButtonElement>,
        idx: number
    ) => {
        event.preventDefault();
        setInventoryItems(prevItems => prevItems.filter((_, index) => index !== idx));
    }

    const handleNewInventoryInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        event.preventDefault();
        setNewInventory(event.target.value);
    };

    const handleNewInventoryAddBt = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
        if (newInventory.length > 0) {
            const newInventoryLower = newInventory.toLowerCase();
            if(inventoryItems.some(item => item.toLowerCase() === newInventoryLower)) {
                showAlertMessage("Inventaris sudah ada", "danger");
            } else {
                setInventoryItems(prevItems => [...prevItems, newInventory]);
                setNewInventory("");
            }
        }
    }

    const handleVehicleKindInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        event.preventDefault();
        setVehicleKind(event.target.value);
    };

    const handleVehicleNumberInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        event.preventDefault();
        setVehicleNumber(event.target.value);
    };

    const handleBBMPercentageInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        event.preventDefault();

        let n = Number(event.target.value);
        n = Math.max(0, Math.min(100, n));
        setBbm(n);
    };

    const handleVehicleAddBt = async (event: React.FormEvent) => {
        event.preventDefault();

        if (imageFileRef.current) {
            imageFileRef.current.value = "";
        }

        if (!imageFile) {
            showAlertMessage("Silahkan pilih gambar kendaraan", "warning");
            return;
        }

        try {
            const newVehicle: VehicleProps = {
                kind: vehicleKind,
                number: vehicleNumber,
                isReady: true,
                invItems: inventoryItems,
                bbm: bbm,
                id: "",
                status: "",
                purpose: "",
                returnDateTime: "",
                resetTime: null,
                timeStamp: "",
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
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.preventDefault();

        try {
            const vehicleDocRef = doc(db, "vehicles", id);
            const vehicleDoc = await getDoc(vehicleDocRef);

            if (vehicleDoc.exists()) {
                const vehicleData = vehicleDoc.data() as VehicleProps;

                if(vehicleData.imageUrl) {
                    const imageRef = ref(storage, vehicleData.imageUrl);
                    try {
                        await deleteObject(imageRef);
                    }
                    catch (error) {
                    }
                }

                await deleteDoc(vehicleDocRef);
                showAlertMessage("Kendaraan berhasil dihapus", "success");
            }
        } catch (error) {
            showAlertMessage("Gagal menghapus kendaraan", "danger");
        }
    };

    const [password, setPassword] = useState<string>("");
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
    const navigate = useNavigate();
    useEffect(() => {
        const checkAdminStatus = () => {
            const adminStatus = checkAdminLoginStatus();
            setIsAdminLoggedIn(adminStatus);
        }
        checkAdminStatus();
        const timer = setInterval(checkAdminStatus, 30000);
        return () => clearInterval(timer);
    }, []);

    const handlePasswordInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    }

    /////////////////////////////////////////////////
    // LOGIN EXPIRATION
    const LOGIN_EXPIRATION_TIME = 30 * 60 * 1000;
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
                    setPassword("");
                } else {
                    showAlertMessage("Password salah!", "danger");
                }
            }
        }
    }

    const handleCancelPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        navigate("/");
    }

    const handleExportToExcel = async (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
        ExportToExcel("history_data");
    }

    return (
        <div>
            <Header
                admin={true}
                loggedIn={isAdminLoggedIn}
                changePWSuccess={() => {
                    showAlertMessage("Password berhasil diubah", "success");
                }}
            />
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
            {!isAdminLoggedIn ? (
                <div id="admin-form-container">
                    <div id="popup-wrapper">
                        <div id="popup-content" style={{ maxWidth: "400px" }}>
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

                                <form>
                                    <div id="admin-popup-content">
                                        <input type="password" className="form-control" placeholder="Password"
                                            value={password}
                                            onChange={(e) => handlePasswordInputChange(e)}
                                        />
                                        <button type="submit" className="btn btn-primary"
                                            onClick={(e) => handleConfirmPassword(e)}
                                        >Masuk</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
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
                                                                                        user.borrowId,
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
                                                                            e.preventDefault();
                                                                            if (user.vehicleId) {
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
                                        <div id="inventory-container">
                                            {inventoryItems.length == 0 ? (
                                                <label>Belum ada inventaris</label>
                                            ) : inventoryItems?.map((item, index) => (
                                                <div id="inventory-items">
                                                    <label>{item}</label>
                                                    <button
                                                        className="btn"
                                                        id="inventory-item-button"
                                                        onClick={(e) => {
                                                            handleInventoryDeleteBt(e, index);
                                                        }}
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                        <div className="row">
                                            <div
                                                id="inventory-add-command">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={newInventory}
                                                    placeholder="Masukkan inventaris"
                                                    onChange={(e) => {
                                                        handleNewInventoryInputChange(e);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if(e.key === "Enter") {
                                                            e.preventDefault();
                                                            if (newInventory.length > 0) {
                                                                const newInventoryLower = newInventory.toLowerCase();
                                                                if(inventoryItems.some(item => item.toLowerCase() === newInventoryLower)
                                                                ) {
                                                                    showAlertMessage("Inventaris sudah ada", "danger");
                                                                } else {
                                                                    setInventoryItems(prevItems => [...prevItems, newInventory]);
                                                                    setNewInventory("");
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                className="btn"
                                                style={{ backgroundColor: "#00788d", color:"white" }}
                                                onClick={(e) => {
                                                    handleNewInventoryAddBt(e);
                                                }}
                                                >Tambah</button>
                                            </div>
                                        </div>
                                    <div className="row" style={{ justifyContent: "center" }}>
                                        <input
                                            className="form-control mb-2"
                                            type="file"
                                            ref={imageFileRef}
                                            onChange={(e) => handleFileChange(e)}
                                            accept="image/*"
                                        />
                                        {imageUrl && (
                                            <img
                                                src={imageUrl}
                                                style={{
                                                    width: "200px",
                                                    height: "200px",
                                                    objectFit: "contain"
                                                }}
                                            />
                                        )}
                                    </div>

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
                                                onClick={(e) => { handleExportToExcel(e); }}
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
                                                                index={index}
                                                                onSaveClick={() => {
                                                                    showAlertMessage("Data kendaraan berhasil disimpan", "success");
                                                                }}
                                                            />
                                                            <div className="row">
                                                                <button
                                                                    className="btn"
                                                                    id="button"
                                                                    style={{ backgroundColor: "#dc3545" }}
                                                                    onClick={(e) => {
                                                                        if (!vehicle.isReady) {
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