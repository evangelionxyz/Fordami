import {
    DocumentData,
    query,
    collection,
    where,
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
import { deleteObject, ref } from "firebase/storage";
import { uploadImage } from "../components/ImageUpload";
import { formatDateTime } from "../utils";
import "../styles/VehicleDetails.css";
import Button from "./Button";

export interface VehicleProps {
    id: string;
    kind: string;
    number: string;
    isReady: boolean;
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
        console.error("Error getting document:", error);
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
    }

    const handleVehicleSaveBt = async (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setEditing(false);

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
                            <label className="form-label">{vehicle.number}</label>
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
                            {vehicle.purpose ? vehicle.purpose : "Belum ada tujuan"}
                        </label>
                    </div>
                </div>

                <div className="row" id="vd-form-content">
                    <div className="col-6" id="vd-form">
                        <label className="form-label">Jam Pengembalian</label>
                    </div>
                    <div className="col-6">
                        <label className="form-label">{vehicle.returnDateTime 
                                ? formatDateTime(vehicle.returnDateTime) + " WIT"
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
                                            <label>{item}</label>
                                            <button
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

export const VehicleDetailsById = ({ vehicleId }: { vehicleId: string }) => {
    const [vehicle, setVehicle] = useState<VehicleProps | null>(null);
    useEffect(() => {
        const fetchVehicle = async () => {
            const vehicleData = await getVehicleById(vehicleId);
            setVehicle(vehicleData);
        };
        fetchVehicle();
    }, [vehicleId]);

    if (!vehicle) return <div>Loading vehicle details...</div>;

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
                    <div className="row">
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
                    <label>Time Stamp</label>
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
                    <label>{formatDateTime(vehicle.returnDateTime)} WIT</label>
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
                vehicle.resetTime && new Date(vehicle.resetTime) <= now && !vehicle.isReady
            );

            if (vehiclesToReset.length > 0) {
                setResettingVehicles(vehiclesToReset.map(v => v.id));

                for (const vehicle of vehiclesToReset) {
                    try {
                        const vehicleDocRef = doc(db, "vehicles", vehicle.id);
                        await updateDoc(vehicleDocRef, {
                            isReady: true,
                            status: "",
                            purpose: "",
                            returnDateTime: "",
                            resetTime: null,
                            timeStamp: "",
                        });

                        const userRef = collection(db, "users");
                        const q = query(userRef, where("vehicleId", "==", vehicle.id));

                        const querySnapShot = await getDocs(q);

                        querySnapShot.forEach(async (doc) => {
                            await updateDoc(doc.ref, {
                                vehicleId: "",
                            });
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
