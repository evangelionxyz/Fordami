import {
    DocumentData,
    query,
    collection,
    where,
    deleteDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    QuerySnapshot,
    DocumentSnapshot
} from "firebase/firestore";

import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
    useRef
} from "react";
import { vehiclesCollection } from "../lib/Controller";
import { db, storage } from "../lib/Firebase";
import { connectStorageEmulator, deleteObject, ref } from "firebase/storage";
import { uploadImage } from "../components/ImageUpload";
import { formatDateTime } from "../utils";
import "../styles/VehicleDetails.css";

export interface VehicleProps {
    id: string;
    kind: string;
    number: string;
    isReady: boolean;
    isBooked: boolean;
    bbm: number;
    status: string;
    purpose: string;
    returnDateTime: string;
    resetTime: Date | null;
    timeStamp: string;
    imageUrl: string;

    // inventory
    invItems: string[];
};

interface VehicleContext {
    vehicles: VehicleProps[];
    setVehicles: React.Dispatch<React.SetStateAction<VehicleProps[]>>;
};

const VehicleContext = createContext<VehicleContext | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [vehicles, setVehicles] = useState<VehicleProps[]>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            vehiclesCollection,
            (snapshot: QuerySnapshot<DocumentData>) => {
                setVehicles(
                    snapshot.docs.map(
                        (doc) =>
                        ({
                            id: doc.id,
                            ...doc.data(),
                        } as VehicleProps)
                    )
                );
            }
        );

        return () => unsubscribe();
    }, []);

    return (
        <VehicleContext.Provider value={{ vehicles, setVehicles }}>
            {children}
        </VehicleContext.Provider>
    );
};

export const useVehicles = (): VehicleContext => {
    const context = useContext(VehicleContext);
    if (!context) {
        throw new Error("useVehicles must be used within a VehicleProvider");
    }
    return context;
};

export const getVehicleById = async (id: string): Promise<VehicleProps | null> => {
    try {
        const docRef = doc(db, "vehicles", id);
        const docSnap: DocumentSnapshot = await getDoc(docRef);

        if (docSnap.exists()) {
            const vehicleData = docSnap.data() as VehicleProps;
            return { ...vehicleData, id: docSnap.id };
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting vehicle document:", error);
        return null;
    }
};


interface VehicleDetailsProps {
    index: number;
    onSaveClick?: () => void;
}

export const VehicleDetailsByIndex = ({ index, onSaveClick }: VehicleDetailsProps) => {
    const getPercentageColor = () => {
        if (vehicle.bbm) {
            if (vehicle.bbm >= 75) return "#28a745";
            if (vehicle.bbm >= 50) return "#ffc107";
            if (vehicle.bbm >= 25) return "#fd7e14";
        }
        return "#dc3545";
    };

    const { vehicles } = useVehicles();
    const [editing, setEditing] = useState<boolean>(false);
    const [bbm, setBbm] = useState(100);
    const [currentImgUrl, setCurrentImgUrl] = useState<string>("");
    const imageFileRef = useRef<HTMLInputElement>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [vehicleNumber, setVehicleNumber] = useState<string>("");
    const [newInventory, setNewInventory] = useState<string>("");
    const [inventoryItems, setInventoryItems] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState<string>("");

    const vehicle = vehicles[index];
    let editVehicle = vehicle;

    const handleBBMPercentageInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        let n = Number(event.target.value);
        n = Math.max(0, Math.min(100, n));
        setBbm(n);
    };

    const handleVehicleEditBt = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setEditing(true);
        editVehicle = vehicle;
        setInventoryItems(editVehicle.invItems);

        // set current vehicle's image url
        setCurrentImgUrl(editVehicle.imageUrl);
        setVehicleNumber(editVehicle.number);
    }

    const handleVehicleSaveBt = async (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setEditing(false);
        editVehicle.number = vehicleNumber;
        editVehicle.bbm = bbm;
        if(imageUrl.length > 0) {
            editVehicle.imageUrl = imageUrl;
        }

        try {
            // delete old image url
            if(currentImgUrl.length > 0) {
                if(currentImgUrl != editVehicle.imageUrl) {
                    const imageRef = ref(storage, currentImgUrl);
                    await deleteObject(imageRef);
                }
            }

            const vehicleDocRef = doc(db, "vehicles", vehicle.id);
            await updateDoc(vehicleDocRef, {
                imageUrl: editVehicle.imageUrl,
                bbm: editVehicle.bbm,
                invItems: inventoryItems
            });

            if (onSaveClick) {
                onSaveClick();
            }

        } catch (error) {
            console.error("Failed to update vehicle: ", error);
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        if (e.target.files) {
            const selectedFile = e.target.files[0];
            setImageFile(selectedFile);

            const newImageUrl = await uploadImage(selectedFile);
            setImageUrl(newImageUrl);
            console.log("Image uploaded", newImageUrl);
        }
    }

    const handleVehicleCancelEdit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        // delete old image url
        if (imageUrl.length > 0) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        }

        setImageUrl("");
        setEditing(false);
    }

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
            if(!inventoryItems.some(item => item.toLowerCase() === newInventoryLower)) {
                setInventoryItems(prevItems => [...prevItems, newInventory]);
                setNewInventory("");
            }
        }
    }

    const handleVehicleNumberInputChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        event.preventDefault();
        setVehicleNumber(event.target.value);
    };

    return (
        <>
            <div className="row">
                <div className="row" id="vd-form-content">
                    <div className="col-6" id="vd-form">
                        <label className="form-label">Jenis Kendaraan</label>
                    </div>
                    <div className="col-6">
                        <div className="row">
                            <label className="form-label">{vehicle.kind}</label>
                        </div>
                        <div className="row">
                            {editing ? (
                                <input
                                type="text"
                                value={vehicleNumber}
                                className="form-control mb-2"
                                onChange={handleVehicleNumberInputChange}
                            ></input>
                            ) : (
                                <label className="form-label">{vehicle.number}</label>
                            )}
                        </div>
                    </div>
                </div>

                <div className="row" id="vd-form-content">
                    <div className="col-6" id="vd-form">
                        <label className="form-label">Gambar</label>
                    </div>
                    <div className="col-6">
                        <div className="row">
                            <img
                                style={{
                                    width: "180px",
                                    height: "180px",
                                    marginBottom: "8px",
                                    objectFit: "contain"
                                }}
                                src={imageUrl ? imageUrl : vehicle.imageUrl}></img>
                        </div>
                    </div>
                    {editing && (
                        <input
                            className="form-control mb-2"
                            type="file"
                            accept="image/*"
                            ref={imageFileRef}
                            onChange={(e) => handleFileChange(e)}
                        />
                    )}
                </div>

                <div className="row" id="vd-form-content">
                    <div className="col-6" id="vd-form">
                        <label className="form-label">Status</label>
                    </div>
                    <div className="col-6">
                        <label className="form-label">
                            {vehicle.status
                                ? vehicle.status
                                : "Kendaraan siap digunakan"}
                        </label>
                    </div>
                </div>

                <div className="row" id="vd-form-content">
                    <div className="col-6" id="vd-form">
                        <label className="form-label">Tujuan</label>
                    </div>
                    <div className="col-6">
                        <label className="form-label">
                            {vehicle.purpose && !vehicle.isBooked ? vehicle.purpose : "Belum ada tujuan"}
                        </label>
                    </div>
                </div>

                <div className="row" id="vd-form-content">
                    <div className="col-6" id="vd-form">
                        <label className="form-label">Waktu Pengembalian</label>
                    </div>
                    <div className="col-6">
                        <label className="form-label">{vehicle.returnDateTime && !vehicle.isBooked
                                ? formatDateTime(vehicle.returnDateTime)
                                : "Belum ada"}
                        </label>
                    </div>
                </div>

                <div className="row" id="vd-form-content">
                    <div className="col-6" id="vd-form">
                        <label className="form-label">Inventaris Kendaraan</label>
                    </div>
                    <div className="col-6">
                        <div className="row mb-2">
                            {editing ? (
                                <>
                                    {inventoryItems.map((item, index) => (
                                        <div style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            justifyContent: "space-between",
                                            gap: "0.1rem"
                                        }}>
                                            <label key={index}>{item}</label>
                                            <button
                                                key={index}
                                                className="btn"
                                                id="inventory-item-button"
                                                onClick={(e) => {
                                                    handleInventoryDeleteBt(e, index)
                                                }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                vehicle.invItems.map((item, index) => (
                                    <label>{item}</label>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="row" id="vd-form-content">
                    {editing ? (
                        <>
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
                                                if(!inventoryItems.some(item => item.toLowerCase() === newInventoryLower)) {
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
                            <div className="col-6" id="vd-form">
                                <label className="form-label">Jumlah BBM</label>
                            </div>
                            <div className="col-6" id="vd-form">
                                <input
                                    type="number"
                                    className="form-control mb-2"
                                    value={bbm}
                                    min={0}
                                    max={100}
                                    onChange={handleBBMPercentageInputChange}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="col-6" id="vd-form">
                                <label className="form-label">BBM {vehicle.bbm}%</label>
                            </div>
                            <div className="col-6">
                                <div
                                    className="progress"
                                    role="progressbar"
                                    aria-valuenow={bbm}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <div
                                        className="progress-bar"
                                        style={{
                                            backgroundColor: getPercentageColor(),
                                            width: vehicle.bbm + "%",
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>

            <div className="row">
                {editing && vehicle.isReady ? (
                    <>
                        <div className="col-6">
                            <button
                                className="btn"
                                id="button"
                                style={{
                                    backgroundColor: "#dc3545",
                                    color: "white",
                                    marginTop: "10px",
                                    width: "100%"
                                }}
                                onClick={(e) => {
                                    handleVehicleCancelEdit(e);
                                }}
                            >Batal
                            </button>
                        </div>

                        <div className="col-6">
                            <button
                                className="btn"
                                id="button"
                                style={{
                                    backgroundColor: "#00788d",
                                    color: "white",
                                    marginTop: "10px",
                                    width: "100%"
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (vehicle.isReady) {
                                        handleVehicleSaveBt(e);
                                    }
                                }}
                            >Simpan
                            </button>
                        </div>

                    </>

                ) : !editing && vehicle.isReady && (
                    <button
                        className="btn"
                        id="button"
                        style={{ backgroundColor: "#00788d" }}
                        onClick={(e) => {
                            e.preventDefault();
                            if (!vehicle.isReady) {

                            } else {
                                handleVehicleEditBt(e);
                            }
                        }}
                    >Edit
                    </button>
                )}

            </div>

        </>
    );
};

interface VehicleDetailsPropsById {
    vehicleId: string;
    userId: string;
    borrowId: string
    onChangeSuccess?: () => void;
    onChangeFailed?: () => void;
}

export const VehicleDetailsById: React.FC<VehicleDetailsPropsById> = ({vehicleId, userId, borrowId, onChangeSuccess, onChangeFailed}) => {
    const [vehicle, setVehicle] = useState<VehicleProps | null>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [returnDateTime, setReturnDateTime] = useState<string>("");
    const [resetTime, setResetTime] = useState<Date | null>(null);

    useEffect(() => {
        const fetchVehicle = async () => {
            const vehicleData = await getVehicleById(vehicleId);
            setVehicle(vehicleData);
        };
        fetchVehicle();
    }, [vehicleId]);

    if (!vehicle) return <div>Memuat kendaraan</div>;

    const handleResetBt = async (
        event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        try {
            const userDocRef = doc(db, "users", userId);
            const vehicleDocRef = doc(db, "vehicles", vehicleId);

            await updateDoc(vehicleDocRef, {
                isReady: true,
                status: "",
                purpose: "",
                resetTime: null,
                timeStamp: "",
                returnDateTime: ""
            });

            await updateDoc(userDocRef, {
                vehicleId: "",
            });

        } catch (error) {
            console.error("Failed to reset user:", error);
        }
    };

    const handleSaveEditBt = async (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
        setEditing(!editing);
        if(editing && resetTime) {
            // valid if the reset time is bigger than current vehicle's reset time.
            const now = new Date();
            const valid = now <= resetTime;

            if(valid) {
                const vehicleDocRef = doc(db, "vehicles", vehicleId);
                await updateDoc(vehicleDocRef, {
                    returnDateTime: returnDateTime,
                    resetTime: resetTime?.toISOString(),
                });

                if(onChangeSuccess) {
                    onChangeSuccess();
                }

                 // updates the history
                 const historyDocRef = doc(db, "history", borrowId);
                 await updateDoc(historyDocRef, {
                    returnDateTime: formatDateTime(returnDateTime)
                 });

                setTimeout(() => window.location.reload(), 1000);
                
            } else {
                if(onChangeFailed) {
                    onChangeFailed();
                }
            }
            setResetTime(null);
            setReturnDateTime("");
        }
    }

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

    return (
        <>
            <div className="row">
                <div className="col">
                    <label>Jenis Kendaraan</label>
                </div>
                <div className="col">
                    <div className="row">
                        <label>{vehicle.kind}</label>
                    </div>
                    <div className="row mb-2">
                        <label>{vehicle.number}</label>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <label>Gambar</label>
                </div>
                <div className="col">
                    <div className="row">
                        <img
                            style={{
                                width: "180px",
                                height: "180px",
                                marginBottom: "8px",
                                objectFit: "contain"
                            }}
                            src={vehicle.imageUrl}></img>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <label>Timestamp</label>
                </div>
                <div className="col">
                    <label>{vehicle.timeStamp} WIT</label>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <label>Waktu Pengembalian</label>
                </div>
                <div className="col">
                    {editing ? (
                        <input
                        type="datetime-local"
                        value={returnDateTime}
                        className="form-control"
                        placeholder="2024-07-25T15:00"
                        onChange={handleReturnTimeInputChange}
                    />
                    ) : (
                        <label>{formatDateTime(vehicle.returnDateTime)} WIT</label>
                    )
                    }
                </div>
            </div>


            <div className="row">
                <div className="col-6">
                    <button
                        className="btn btn-danger"
                        style={{
                            color: "white",
                            marginTop: "10px",
                            width: "100%"
                        }}
                        onClick={(e) => handleResetBt(e)}
                    >
                        Reset
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
                        onClick={(e) => handleSaveEditBt(e)}
                    >
                        {editing ? "Simpan" : "Ubah"}
                    </button>
                </div>
            </div>
        </>
    );
};

export function useVehiclesStatusCheck(vehicles: VehicleProps[]) {
    const [resettingVehicles, setResettingVehicles] = useState<string[]>([]);
    useEffect(() => {
        const checkVehicles = async () => {
            const now = new Date();
            const vehiclesToReset = vehicles.filter(vehicle =>
                vehicle.resetTime && new Date(vehicle.resetTime) <= now);
            if (vehiclesToReset.length > 0) {
                setResettingVehicles(vehiclesToReset.map(v => v.id));

                for (const vehicle of vehiclesToReset) {
                    try {
                        const vehicleDocRef = doc(db, "vehicles", vehicle.id);
                        await updateDoc(vehicleDocRef, {
                            isReady: true,
                            isBooked: false,
                            status: "",
                            purpose: "",
                            returnDateTime: "",
                            resetTime: null,
                            timeStamp: "",
                        });

                        // remove reset all users with the same vehicle id
                        const userQuery = query(collection(db, "users"), where("vehicleId", "==", vehicle.id));
                        const userQuerySnapShot = await getDocs(userQuery);
                        userQuerySnapShot.forEach(async (doc) => {
                            await updateDoc(doc.ref, {
                                vehicleId: "",
                            });
                        });

                        // remove all queue with the same vehicle id
                        const queueQuery = query(collection(db, "queue"), where("vehicleId", "==", vehicle.id));
                        const queueQuerySnapshot = await getDocs(queueQuery);
                        queueQuerySnapshot.forEach(async (doc) => {
                            await deleteDoc(doc.ref);
                        });

                    } catch (error) {
                        console.error("Failed to reset vehicle ", vehicle.id, error);
                    }
                }
                setResettingVehicles([]);
            }
        };

        checkVehicles();
        const timer = setInterval(checkVehicles, 60000);

        return () => clearInterval(timer);
    }, [vehicles]);

    return resettingVehicles;
};
