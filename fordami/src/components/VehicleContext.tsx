import { DocumentData, doc, getDoc, onSnapshot, QuerySnapshot, DocumentSnapshot} from "firebase/firestore";
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
  returnTime: string;
  isoReturnTime: string;
  timeStamp: string;
  imageUrl: string;
  
  // inventory
  p3k: boolean;
  umbrella: boolean;
  spareTire: boolean;
  jack: boolean;
  id: string;
}

interface VehicleContext {
  vehicles: VehicleProps[];
  setVehicles: React.Dispatch<React.SetStateAction<VehicleProps[]>>;
}

const VehicleContext = createContext<VehicleContext | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: ReactNode }> = ( {children} ) => {
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

    if(docSnap.exists()) {
      const vehicleData = docSnap.data() as VehicleProps;
      return { ...vehicleData, id: docSnap.id};
    } else {
      console.log("No such document!");
      return null;
    }
  } catch(error) {
    console.error("Error getting document:", error);
    return null;
  }
}

export const VehicleDetailsByIndex = ({ idx }: { idx: number }) => {
  const { vehicles } = useVehicles();
  const currVehicle = vehicles[idx];

  const getPercentageColor = () => {
    if (currVehicle.bbm) {
      if (currVehicle.bbm >= 75) return "#28a745";
      if (currVehicle.bbm >= 50) return "#ffc107";
      if (currVehicle.bbm >= 25) return "#fd7e14";
    }
    return "#dc3545";
  };

  return (
    <div className="row">
      <div className="row" id="vd-form-content">
        <div className="col-6" id="vd-form">
          <label className="form-label">Jenis Kendaraan</label>
        </div>
        <div className="col-6">
          <div className="row">
            <label className="form-label">{currVehicle.kind}</label>
          </div>
          <div className="row">
            <label className="form-label">{currVehicle.number}</label>
          </div>
        </div>
      </div>

      <div className="row" id="vd-form-content">
        <div className="col-6" id="vd-form">
          <label className="form-label">Gambar</label>
        </div>
        <div className="col-6">
          <div className="row">
            <img style={{width:"150px", height:"150px", marginBottom:"8px"}} src={currVehicle.imageUrl}></img>
          </div>
        </div>
      </div>

      <div className="row" id="vd-form-content">
        <div className="col-6" id="vd-form">
          <label className="form-label">Status</label>
        </div>
        <div className="col-6">
          <label className="form-label">
            {currVehicle.status
              ? currVehicle.status
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
            {currVehicle.purpose ? currVehicle.purpose : "Belum ada tujuan"}
          </label>
        </div>
      </div>

      <div className="row" id="vd-form-content">
        <div className="col-6" id="vd-form">
          <label className="form-label">Jam Pengembalian</label>
        </div>
        <div className="col-6">
          <label className="form-label">
            {currVehicle.returnTime ? currVehicle.returnTime+" WIT": "Belum ada"}
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
              <label className="form-label" id="vd-form-inventory-content">
                {currVehicle.p3k ? "Ada" : "Tidak"}
              </label>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <label className="form-label">Ban Serep</label>
            </div>
            <div className="col-6">
              <label className="form-label" id="vd-form-inventory-content">
                {currVehicle.spareTire ? "Ada" : "Tidak"}
              </label>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <label className="form-label">Payung</label>
            </div>
            <div className="col-6">
              <label className="form-label" id="vd-form-inventory-content">
                {currVehicle.umbrella ? "Ada" : "Tidak"}
              </label>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <label className="form-label">Dongkrak</label>
            </div>
            <div className="col-6">
              <label className="form-label" id="vd-form-inventory-content">
                {currVehicle.jack ? "Ok" : "Tidak"}
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="row" id="vd-form-content">
        <div className="col-6" id="vd-form">
          <label className="form-label">BBM {currVehicle.bbm}%</label>
        </div>
        <div className="col-6">
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={currVehicle.bbm}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-bar"
              style={{
                backgroundColor: getPercentageColor(),
                width: currVehicle.bbm + "%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
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
          <img style={{width:"150px", height:"150px", margin:"8px"}} src={vehicle.imageUrl}></img>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Time Stamp</label>
        </div>
        <div className="col">
          <label>{vehicle.timeStamp}</label>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <label>Waktu Pengembalian</label>
        </div>
        <div className="col">
          <label>{vehicle.returnTime} WIT</label>
        </div>
      </div>
    </>
  );
};
