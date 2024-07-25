import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { DocumentData, onSnapshot, QuerySnapshot } from "firebase/firestore";
import { usersCollection } from "../lib/Controller";

export interface UserProps {
    id: string;
    name: string;
    vehicleId: string;
}

interface UserContext {
    users: UserProps[];
    setUsers: React.Dispatch<React.SetStateAction<UserProps[]>>;
}

const UserContext = createContext<UserContext | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [users, setUsers] = useState<UserProps[]>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            usersCollection,
            (snapshot: QuerySnapshot<DocumentData>) => {
                setUsers(
                    snapshot.docs.map(
                        (doc) =>
                        ({
                            id: doc.id,
                            ...doc.data(),
                        } as UserProps)
                    )
                );
            }
        );

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ users, setUsers }}>
            {children}
        </UserContext.Provider>
    )
};

export const useUsers = (): UserContext => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUsers must be used within a UserProvider');
    }
    return context;
};
