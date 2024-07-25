import { utils, write } from "xlsx";
import { saveAs } from "file-saver";
import { VehicleProps } from "./VehicleContext";

export const ExportVehicleToExcel = (fileName: string, vehicles: VehicleProps[]) => {
    try {
        const data = vehicles.map((vehicle) => ({
            "Jenis Kendaraan Dinas": vehicle.kind || "Tidak diketahui",
            "Nomor Kendaraan": vehicle.number || "Tidak diketahui",
            "Status": vehicle.status || "Kendaraan siap digunakan",
            "Tujuan Penggunaan": vehicle.purpose || "Belum ada",
            "Waktu Pengembalian": vehicle.returnDateTime || "Belum ada",
            "P3K": vehicle.p3k ? "Ada" : "Tidak Ada",
            "Payung": vehicle.umbrella ? "Ada" : "Tidak Ada",
            "Ban Cadangan": vehicle.spareTire ? "Ada" : "Tidak Ada",
            "Dongkrak": vehicle.jack ? "Ada" : "Tidak Ada",
        }));

        const ws = utils.json_to_sheet(data);

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Sheet1");

        const excelBuffer = write(wb, { bookType: "xlsx", type: "array" });
        const dataBlob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });

        saveAs(dataBlob, fileName + ".xlsx");
    } catch (error) {
        console.error("Error exporting to Excel:", error);
    }
};