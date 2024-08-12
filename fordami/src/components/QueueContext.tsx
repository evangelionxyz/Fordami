import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { DocumentData, onSnapshot, QuerySnapshot } from "firebase/firestore";
import { queueCollection } from "../lib/Controller";
import { UserProps, getUserById } from "./UserContext";
import { VehicleProps, getVehicleById } from "./VehicleContext";
import "../styles/Queue.css"

export interface QueueProps {
    userId: string;
    vehicleId: string;
    id: string;
}

interface QueueContext {
    queues: QueueProps[];
    setQueues: React.Dispatch<React.SetStateAction<QueueProps[]>>;
}

const QueueContext = createContext<QueueContext | undefined>(undefined);

export const QueueProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [queues, setQueues] = useState<QueueProps[]>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            queueCollection,
            (snapshot: QuerySnapshot<DocumentData>) => {
                setQueues(
                    snapshot.docs.map(
                        (doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        } as QueueProps)
                    )
                );
            }
        )
        return () => unsubscribe();
    }, []);

    return (
        <QueueContext.Provider value={{queues, setQueues}}>
            {children}
        </QueueContext.Provider>
    )
}

export const useQueues = (): QueueContext => {
    const context = useContext(QueueContext);
    if(!context)  {
        throw new Error("useQueues must be used within a QueueProvider");
    }
    return context;
}

export const QueueDetails = ({userId, vehicleId}: {userId: string, vehicleId: string}) => {
    
    const [user, setUser] = useState<UserProps | null>();
    const [vehicle, setVehicle] = useState<VehicleProps | null>();

    useEffect(() => {
        const fetchData = async() => {
            const userData = await getUserById(userId);
            const vehicleData = await getVehicleById(vehicleId);
            setUser(userData);
            setVehicle(vehicleData);
        };
        fetchData();
    }, [userId, vehicleId]);

    if(!user || !vehicle) return <div>Memuat data</div>;

    return (
        <>
            <div className="row">
                <div className="col-6">
                    <label>Nama</label>
                </div>
                <div className="col-6">
                    <label>{user.name}</label>
                </div>

                <div className="col-6">
                    <label>Kendaraan</label>
                </div>
                <div className="col-6">
                    <label>{vehicle.kind}</label>
                </div>

                <div className="col-6">
                    <label>Tujuan</label>
                </div>
                <div className="col-6">
                    <label>{vehicle.purpose}</label>
                </div>

                <div className="col-6">
                    <label>Waktu Pengembalian</label>
                </div>
                <div className="col-6">
                    <label>{vehicle.returnDateTime
                        .replaceAll('-', '/')
                        .replace('T', ' ')}</label>
                </div>
            </div>
        </>
    );
}