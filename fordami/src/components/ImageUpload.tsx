/// <reference path="../utils.ts" />
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/Firebase";
import { generateSimpleId } from "../utils"

export const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const generatedId = generateSimpleId();
        const storageRef = ref(storage, "vehicle_images/" + generatedId + file.name);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            },
            (error) => {
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error) {
                    reject(error);
                }
            }
        )
    })
}
