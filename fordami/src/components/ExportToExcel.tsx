import { collection, getDocs, Timestamp } from "firebase/firestore";
import { utils, write } from "xlsx";
import { saveAs } from "file-saver";
import { db } from "../lib/Firebase";

export const ExportToExcel = async (
    collectionName: string,
    fileName: string
) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));

        const data = querySnapshot.docs.map((doc) => {
            const docData = doc.data();
            Object.keys(docData).forEach((key) => {
                if (docData[key] instanceof Timestamp) {
                    docData[key] = docData[key].toDate().toISOString();
                } else if (typeof docData[key] === "object" && docData[key] !== null) {
                    docData[key] = JSON.stringify(docData[key]);
                }
            });
            return { id: doc.id, ...docData };
        });

        const ws = utils.json_to_sheet(data);
        const wb = utils.book_new();

        utils.book_append_sheet(wb, ws, "Sheet1");

        const excelBuffer = write(wb, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });
        saveAs(dataBlob, fileName + ".xlsx");

        console.log("Export successful");
    } catch (error) {
        console.error("Error exporting to Excel:", error);
    }
};
