import { utils, write } from "xlsx";
import { saveAs } from "file-saver";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/Firebase"

export const ExportToExcel = async (fileName: string) => {
    try {
        const historiesCollectionRef = collection(db, "history");
        const querySnapshot = await getDocs(historiesCollectionRef);

        // Map the fetched data to the desired format
        const data = querySnapshot.docs.map(doc => doc.data()).map((history, index) => ({
            "No": index + 1,
            "Peminjam": history.userName,
            "Tujuan": history.purpose,
            "Jenis Kendaraan": history.vehicleName,
            "Nomor Kendaraan": history.vehicleNumber,
            "Waktu Pengembalian": history.returnDateTime,
            "Waktu Peminjaman": history.dateTime,
        }));

        const workSheet = utils.json_to_sheet(data);
        const workBook = utils.book_new();
        utils.book_append_sheet(workBook, workSheet, "Sheet1");

        const excelBuffer = write(workBook, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });
        saveAs(dataBlob, fileName + ".xlsx");
    } catch (error) {
        console.error("Error exporting to Excel:", error);
    }
};
