import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { DocumentData,
    onSnapshot,
    QuerySnapshot,
    doc,
    getDoc,
    DocumentSnapshot
} from "firebase/firestore";

import { usersCollection } from "../lib/Controller";
import { db } from "../lib/Firebase";

export interface UserProps {
    id: string;
    borrowId: string;
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

export const getUserById = async (id: string): Promise<UserProps | null> => {
    try {
        const docRef = doc(db, "users", id);
        const docSnap: DocumentSnapshot = await getDoc(docRef);

        if(docSnap.exists()) {
            const userData = docSnap.data() as UserProps;
            return userData;
        } else {
            console.log("No such document");
            return null;
        }
    } catch(error) {
        console.log("Error getting user document: ", error);
        return null;
    }
}
