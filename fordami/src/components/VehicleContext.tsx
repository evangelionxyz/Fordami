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
import { vehiclesCollection } from "../lib/Controller";
import { db } from "../lib/Firebase";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import "../styles/VehicleDetails.css";

export interface VehicleProps {
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
    p3k: boolean;
    umbrella: boolean;
    spareTire: boolean;
    jack: boolean;
    id: string;
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

export const VehicleDetailsByIndex = ({ index, onSaveClick }: VehicleDetailsProps ) => {
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
    const [p3k, setP3k] = useState(true);
    const [umbrella, setUmbrella] = useState(true);
    const [spareTire, setSpareTire] = useState(true);
    const [jack, setJack] = useState(true);

    const vehicle = vehicles[index];
    let editVehicle = vehicle;

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

        setP3k(editVehicle.p3k);
        setUmbrella(editVehicle.umbrella);
        setJack(editVehicle.jack);
        setSpareTire(editVehicle.spareTire);
        setBbm(editVehicle.bbm);
    }

    const handleVehicleSaveBt = async (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        editVehicle.p3k = p3k;
        editVehicle.umbrella = umbrella;
        editVehicle.spareTire = spareTire;
        editVehicle.jack = jack;
        editVehicle.bbm = bbm;

        setEditing(false);

        try {
            const vehicleDocRef = doc(db, "vehicles", vehicle.id);
            await updateDoc(vehicleDocRef, {
                bbm: editVehicle.bbm,
                p3k: editVehicle.p3k,
                umbrella: editVehicle.umbrella,
                jack: editVehicle.jack,
                spareTire: editVehicle.spareTire
            });
            if (onSaveClick) {
                onSaveClick();
            }
            
        } catch (error) {
            console.error("Failed to update vehicle: ", error);
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
                            <img style={{ width: "150px", height: "150px", marginBottom: "8px" }} src={vehicle.imageUrl}></img>
                        </div>
                    </div>
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
                        <label className="form-label">{vehicle.returnDateTime ? vehicle.returnDateTime.replace("T", "; ") + " WIT" : "Belum ada"}
                        </label>
                    </div>
                </div>

                <div className="row" id="vd-form-content">
                    <div className="col-6" id="vd-form">
                        <label className="form-label">Inventaris Kendaraan</label>
                    </div>
                    <div className="col-6">
                        <div className="row">
                            <div className="col-6">
                                <label className="form-label">P3K</label>
                            </div>
                            <div className="col-6">
                                {editing ? (
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="vd-form-inventory-content"
                                        checked={p3k}
                                        onChange={handleP3kChange}
                                    />
                                ) : (
                                    <label className="form-label" id="vd-form-inventory-content">
                                        {vehicle.p3k ? "Ada" : "Tidak"}
                                    </label>
                                )}

                            </div>
                        </div>

                        <div className="row">
                            <div className="col-6">
                                <label className="form-label">Ban Serep</label>
                            </div>
                            <div className="col-6">
                                {editing ? (
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="vd-form-inventory-content"
                                        checked={spareTire}
                                        onChange={handleSpareTireChange}
                                    />
                                ) : (
                                    <label className="form-label" id="vd-form-inventory-content">
                                        {vehicle.spareTire ? "Ada" : "Tidak"}
                                    </label>
                                )}

                            </div>
                        </div>

                        <div className="row">
                            <div className="col-6">
                                <label className="form-label">Payung</label>
                            </div>
                            <div className="col-6">
                                {editing ? (
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="vd-form-inventory-content"
                                        checked={umbrella}
                                        onChange={handleUmbrellaChange}
                                    />
                                ) : (
                                    <label className="form-label" id="vd-form-inventory-content">
                                        {vehicle.umbrella ? "Ada" : "Tidak"}
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-6">
                                <label className="form-label">Dongkrak</label>
                            </div>
                            <div className="col-6">
                                {editing ? (
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="vd-form-inventory-content"
                                        checked={jack}
                                        onChange={handleJackChange}
                                    />
                                ) : (
                                    <label className="form-label" id="vd-form-inventory-content">
                                        {vehicle.jack ? "Ada" : "Tidak"}
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row" id="vd-form-content">
                    {editing ? (
                        <>
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
                    <button
                        className="btn"
                        id="button"
                        style={{ backgroundColor: "#00788d" }}
                        onClick={(e) => {
                            e.preventDefault();
                            if (vehicle.isReady) {
                                handleVehicleSaveBt(e);
                            }
                        }}
                    >Simpan
                    </button>
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
}

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
                        <img style={{ width: "150px", height: "150px", margin: "8px" }} src={vehicle.imageUrl}></img>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <label>Time Stamp</label>
                </div>
                <div className="col">
                    <label>{vehicle.timeStamp.replaceAll("/", "-").replace(".",":")} WIT</label>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <label>Waktu Pengembalian</label>
                </div>
                <div className="col">
                    <label>{vehicle.returnDateTime.replace("T", "; ")} WIT</label>
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
