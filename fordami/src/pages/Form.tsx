import { Card } from "../components/Card";
import React, { useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useVehicles } from "../components/VehicleContext";
import { useUsers } from "../components/UserContext";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/Firebase";

import "../styles/Form.css";
function getTimestamp(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = String(now.getFullYear()).slice(-2);
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}.${minutes}`;
}

const Form = () => {
  const [selectedUser, setSelectedUser] = useState(-1);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(-1);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  const [showPurposeWarn, setShowPurposeWarn] = useState(false);
  const [showReturnTimeWarn, setShowReturnTimeWarn] = useState(false);
  const [showSelectUserWarn, setShowSelectUserWarn] = useState(false);

  const { vehicles } = useVehicles();
  const { users } = useUsers();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  const handlePurposeInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const purpose = event.target.value;
    setPurpose(purpose);
  };

  const handleReturnTimeInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const retTime = event.target.value;
    setReturnTime(retTime);
  };

  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(event.target.value, 10);
    setSelectedUser(index);
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
      const vehicleDocRef = doc(db, "vehicles", vehicleId);
      const [hours, minutes] = returnTime.split(':').map(Number);
      const currentDate = new Date();
      currentDate.setHours(hours);
      currentDate.setMinutes(minutes);
      currentDate.setSeconds(0);
      currentDate.setMilliseconds(0);
      const isoReturnTime = currentDate.toISOString();

      await updateDoc(vehicleDocRef, {
        isReady: false,
        status: "Sedang digunakan oleh " + user.name,
        purpose: purpose,
        returnTime: returnTime,
        isoReturnTime: isoReturnTime,
        timeStamp: getTimestamp(),
      });

      vehicles[selectedVehicle].isReady = false;
      const updatedVehicleDoc = await getDoc(vehicleDocRef);
      if (updatedVehicleDoc.exists()) {
        const updatedVehicleData = updatedVehicleDoc.data();
        console.log("Updated vehicle data:", updatedVehicleData);
      } else {
        console.log("No such user document!");
      }

      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        vehicleId: vehicleId,
      });

      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists()) {
        const updatedUserData = updatedUserDoc.data();
        console.log("Updated user data:", updatedUserData);
      } else {
        console.log("No such user document!");
      }

      setShowConfirmPopup(false);
      setSelectedVehicle(-1);
      setSelectedUser(-1);
      setPurpose("");
      setReturnTime("");

      setAlertMessage("Berhasil meminjam");
      setAlertType("success");
      setShowAlert(true);
      setTimeout(() => {
        setAlertMessage("");
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleCancelBt = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowConfirmPopup(false);
    setSelectedVehicle(-1);
  };

  return (
    <>
      <Header />
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
                  placeholder="Kuala kencana"
                  onChange={handlePurposeInputChange}
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
                  Jam Pengembalian (estimasi)
                </label>
                <input
                  type="time"
                  value={returnTime}
                  className="form-control"
                  placeholder="15.00"
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
                    setShowReturnTimeWarn(returnTime.length < 1);

                    if (
                      selectedUser >= 0 &&
                      purpose.length > 0 &&
                      returnTime.length > 0
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
                          <label>Jam Pengembalian</label>
                        </div>
                        <div className="col">
                          <label>
                            {returnTime.length == 0 ? "-" : returnTime + " WIT"}
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
                          <div className="col">
                            <label>P3K</label>
                          </div>
                          <div className="col">
                            <label>
                              {vehicles[selectedVehicle]?.p3k ? "Ada" : "Tidak"}
                            </label>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col">
                            <label>Payung</label>
                          </div>
                          <div className="col">
                            <label>
                              {vehicles[selectedVehicle]?.umbrella
                                ? "Ada"
                                : "Tidak"}
                            </label>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col">
                            <label>Ban Serep</label>
                          </div>
                          <div className="col">
                            <label>
                              {vehicles[selectedVehicle]?.spareTire
                                ? "Ada"
                                : "Tidak"}
                            </label>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col">
                            <label>Dongkrak</label>
                          </div>
                          <div className="col">
                            <label>
                              {vehicles[selectedVehicle]?.jack
                                ? "Ada"
                                : "Tidak"}
                            </label>
                          </div>
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
