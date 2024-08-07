import {collection, getFirestore} from 'firebase/firestore';
import {getDatabase} from 'firebase/database'

import { app } from './Firebase';

export const firestore = getFirestore(app);
export const databse = getDatabase(app);

// vehicles collection
export const vehiclesCollection = collection(firestore, 'vehicles');
export const usersCollection = collection(firestore, 'users');
export const historyCollection = collection(firestore, 'history');