import { Card } from "../components/Card";
import React, { useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useVehicles, useVehiclesStatusCheck } from "../components/VehicleContext";
import { useUsers } from "../components/UserContext";
import { QueueProps, useQueues } from "../components/QueueContext";
import { doc, addDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { formatDateTime } from "../utils";
import { db } from "../lib/Firebase";
import "../styles/Form.css";

const Form = () => {
    const [selectedUser, setSelectedUser] = useState<number>(-1);
    const [showConfirmPopup, setShowConfirmPopup] = useState<boolean>(false);
    const [purpose, setPurpose] = useState<string>("");

    const [selectedVehicle, setSelectedVehicle] = useState(-1);
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<string>("");
    const [alertType, setAlertType] = useState<string>("success");

    const [showPurposeWarn, setShowPurposeWarn] = useState<boolean>(false);
    const [showReturnTimeWarn, setShowReturnTimeWarn] = useState<boolean>(false);
    const [showSelectUserWarn, setShowSelectUserWarn] = useState<boolean>(false);

    const [returnDateTime, setReturnDateTime] = useState<string>("");
    const [resetTime, setResetTime] = useState<Date | null>(null);

    const showAlertMessage = (msg: string, type: string) => {
        setAlertMessage(msg);
        setAlertType(type);
        setShowAlert(true);
        setTimeout(() => {
            setAlertMessage("");
            setShowAlert(false);
        }, 3000);
    }

    const { vehicles } = useVehicles();
    const { users } = useUsers();
    const { queues } = useQueues();

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
    };

    const handlePurposeInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const purpose = event.target.value;
        setPurpose(purpose);
    };

    useVehiclesStatusCheck(vehicles);

    const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const index = parseInt(event.target.value, 10);
        setSelectedUser(index);
    };

    const handleReturnTimeInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const dateAndTimeString = event.target.value;
        const [datePart, timePart] = dateAndTimeString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(":").map(Number);

        const resetDate = new Date(
            year,
            month-1,
            day,
            hours,
            minutes,
            0,
            0
        );
        setResetTime(resetDate);
        setReturnDateTime(dateAndTimeString);
    };

    const handleConfirmBt = async (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
        const vehicle = vehicles[selectedVehicle];
        const user = users[selectedUser];
        const vehicleId = vehicle.id ?? "";
        const userId = user.id ?? "";

        try {

            // updates vehicle's data
            const vehicleDocRef = doc(db, "vehicles", vehicleId);
            await updateDoc(vehicleDocRef, {
                isBooked: true,
                purpose: purpose,
                returnDateTime: returnDateTime,
                resetTime: resetTime?.toISOString(),
            });
            vehicles[selectedVehicle].isBooked = true;

            // add to admin's queue
            const queueQuery = query(collection(db, "queue"), where("userId", "==", userId));
            const queueQuerySnapshot = await getDocs(queueQuery);
            
            if(!queueQuerySnapshot.empty) {
                // if a document exists, update it with the new vehicle id
                const queueDoc = queueQuerySnapshot.docs[0];
                await updateDoc(queueDoc.ref, {
                    vehicleId: vehicleId
                })
            }
            else {
                // if no document exists, add a new queue document
                const newQueue: QueueProps = {
                    id: "",
                    userId: userId,
                    vehicleId: vehicleId
                };
                const queueDocRef = await addDoc(collection(db, "queue"), newQueue);
                updateDoc(queueDocRef, { id: queueDocRef.id });
                newQueue.id = queueDocRef.id;
            }

            setShowConfirmPopup(false);
            setSelectedVehicle(-1);
            setSelectedUser(-1);
            setPurpose("");
            setReturnDateTime("");
            setResetTime(null);

            showAlertMessage("Peminjaman masuk ke daftar pinjaman", "success");
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    }

    const handleCancelBt = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setShowConfirmPopup(false);
        setSelectedVehicle(-1);
    }

    return (
        <>
            <Header admin={false} />
            <div>
                {showAlert && (
                    <div
                        className={"alert alert-" + alertType + " alert-dismissible"}
                        role="alert"
                        style={{
                            position: "fixed",
                            left: 0,
                            right: 0,
                            zIndex: 1020,
                        }}
                    >
                        {alertMessage}
                    </div>
                )}

                <div id="form-container">
                    <div id="form-user-container">
                        <div id="form-user-input">
                            <form onSubmit={handleSubmit}>
                                <label className="form-label">Nama Pengguna</label>
                                <select
                                    className="form-select"
                                    onChange={(e) => handleUserChange(e)}
                                    onClick={() => setShowSelectUserWarn(false)}
                                    value={selectedUser}
                                >
                                    <option value={-1} disabled={true}>
                                        Pilih...
                                    </option>
                                    {users.map((user, index) => (
                                        <option
                                            value={index}
                                            key={index}
                                            disabled={user.vehicleId?.length != 0}
                                        >
                                            {user.name}
                                        </option>
                                    ))}
                                </select>

                                {showSelectUserWarn && (
                                    <label style={{ color: "#ff3333", fontSize: "14px" }}>
                                        Mohon dipilih terlebih dahulu!
                                    </label>
                                )}
                            </form>
                        </div>

                        <div id="form-user-input">
                            <form onSubmit={handleSubmit}>
                                <label className="form-label">
                                    Tujuan Penggunaan Kendaraan Dinas
                                </label>
                                <input
                                    type="text"
                                    value={purpose}
                                    className="form-control"
                                    onChange={handlePurposeInputChange}
                                    placeholder="Masukkan tujuan"
                                    onClick={() => setShowPurposeWarn(false)}
                                />
                                {showPurposeWarn && (
                                    <label style={{ color: "#ff3333", fontSize: "14px" }}>
                                        Mohon dilengkapi terlebih dahulu!
                                    </label>
                                )}
                            </form>
                        </div>

                        <div id="form-user-input">
                            <form onSubmit={handleSubmit}>
                                <label className="form-label">
                                    Waktu Pengembalian
                                </label>

                                <input
                                    type="datetime-local"
                                    value={returnDateTime}
                                    className="form-control"
                                    placeholder="2024-07-25T15:00"
                                    onChange={handleReturnTimeInputChange}
                                    onClick={() => setShowReturnTimeWarn(false)}
                                />
                                {showReturnTimeWarn && (
                                    <label style={{ color: "#ff3333", fontSize: "14px" }}>
                                        Mohon dilengkapi terlebih dahulu!
                                    </label>
                                )}
                            </form>
                        </div>
                    </div>

                    <div id="content">
                        {vehicles.length > 0 ? (
                            vehicles.map((vehicle, index) => (
                                <Card
                                    index={index}
                                    key={index}
                                    selected={selectedVehicle === index}
                                    onClick={() => {
                                        setShowSelectUserWarn(selectedUser == -1);
                                        setShowPurposeWarn(purpose.length < 1);
                                        setShowReturnTimeWarn(returnDateTime.length < 1);
                                        if (
                                            selectedUser >= 0 &&
                                            purpose.length > 0 &&
                                            returnDateTime.length > 0
                                        ) {
                                            if (vehicle.isReady) {
                                                setSelectedVehicle(index);
                                                setShowConfirmPopup(true);
                                            } else {
                                                setAlertMessage("Kendaraan tidak tersedia");
                                                setAlertType("danger");
                                                setShowAlert(true);
                                                setTimeout(() => {
                                                    setAlertMessage("");
                                                    setShowAlert(false);
                                                }, 3000);
                                            }
                                        }
                                    }}
                                />
                            ))
                        ) : (
                            <div style={{ color: "white" }}>
                                Belum ada kendaraan, mohon untuk tambahkan terlebih dahulu!
                            </div>
                        )}
                    </div>

                    {showConfirmPopup && selectedVehicle >= 0 && selectedUser >= 0 && (
                        <div id="popup-wrapper">
                            <div id="popup-content">
                                <div className="row">
                                    <div id="popup-header">
                                        <label>
                                            <strong>Detail Peminjaman</strong>
                                        </label>
                                        <button
                                            id="popup-close-button"
                                            onClick={(e) => handleCancelBt(e)}
                                        >
                                            &times;
                                        </button>
                                    </div>

                                    {selectedUser >= 0 && (
                                        <div id="popup-details">
                                            <div className="row">
                                                <div className="col">
                                                    <label>Nama Pengguna</label>
                                                </div>
                                                <div className="col">
                                                    <label>{users[selectedUser]?.name}</label>
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col">
                                                    <label>Tujuan Penggunaan</label>
                                                </div>
                                                <div className="col">
                                                    <label>{purpose.length == 0 ? "-" : purpose}</label>
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col">
                                                    <label>Waktu Pengembalian</label>
                                                </div>
                                                <div className="col">
                                                    <label>
                                                        {returnDateTime.length == 0
                                                            ? "-"
                                                            : formatDateTime(returnDateTime)}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <div className="row mb-2">
                                            <div className="col">
                                                <label>Jenis Kendaraan</label>
                                            </div>
                                            <div className="col">
                                                <div className="row">
                                                    <label>{vehicles[selectedVehicle]?.kind}</label>
                                                </div>
                                                <div className="row">
                                                    <label>{vehicles[selectedVehicle]?.number}</label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row mb-2">
                                            <div className="col">
                                                <label>Inventaris Kendaraan</label>
                                            </div>
                                            <div className="col">
                                                <div className="row">
                                                    {vehicles[selectedVehicle]?.invItems.map((item, index) => (
                                                        <label>{item}</label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row mt-9">
                                            <div className="col">
                                                <label>
                                                    BBM {vehicles[selectedVehicle]?.bbm + "%"}
                                                </label>
                                            </div>
                                            <div className="col">
                                                <div
                                                    className="progress"
                                                    role="progressbar"
                                                    aria-valuenow={vehicles[selectedVehicle]?.bbm}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                >
                                                    <div
                                                        className="progress-bar"
                                                        style={{
                                                            backgroundColor: "#1155AA",
                                                            width: vehicles[selectedVehicle]?.bbm + "%",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="container text-center">
                                        <div className="row">
                                            <div className="col-6">
                                                <button
                                                    className="btn btn-danger"
                                                    id="button"
                                                    style={{ width: "100%" }}
                                                    onClick={(e) => handleCancelBt(e)}
                                                >
                                                    Batal
                                                </button>
                                            </div>

                                            <div className="col-6">
                                                <button
                                                    className="btn"
                                                    id="button"
                                                    style={{ backgroundColor: "#00788d", width: "100%" }}
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
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Form;
