import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { storage, db } from "../lib/Firebase";

export const Test: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!file) {
      return;
    }

    const storageRef = ref(storage, "images/" + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
      },
      (error) => {
        console.error("Error uploading file:", error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setImageUrl(downloadURL);
        await addDoc(collection(db, "images"), {
          name: file.name,
          url: downloadURL,
          createdAt: new Date(),
        });
      }
    );
  };

  return (
    <>
      <input type="file" onChange={(e) => handleFileChange(e)} accept="image/*" />
      <button onClick={(e) => handleUpload(e)} disabled={!file}>
        Upload
      </button>
      {progress > 0 && <p>Upload Progress: {progress.toFixed(2)}%</p>}
      {imageUrl && (
        <div>
          <p>Uploaded Image:</p>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: "300px" }} />
        </div>
      )}
    </>
  );
};

export const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, "vehicle_images/"+file.name);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log("Upload is " + progress + "% done");
            },
            (error) => {
                console.error("Error uploading file:", error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch(error) {
                    reject(error);
                }
            }
        )
    })
}
