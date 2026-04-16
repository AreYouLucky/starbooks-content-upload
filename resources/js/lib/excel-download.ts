import ExcelJS from "exceljs";
import { ApprovalRequestModel, BatchModel } from "@/types/model";
import { quarters } from "./default";
export const downloadShortlisted = async ({ records, batch }: { records: ApprovalRequestModel[], batch: BatchModel }) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const batchName = batch.batch_name;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    // =========================
    // HEADER TITLES
    // =========================
    worksheet.mergeCells("A1:J1");
    worksheet.mergeCells("A2:J2");
    worksheet.mergeCells("A3:J3");

    worksheet.getCell("A1").value = "STARBOOKS Content Committee Review";
    worksheet.getCell("A2").value = "SHORTLISTED CONTENT";
    worksheet.getCell("A3").value = quarters.find((q) => q.value === batch.quarter)?.desc + " " + batch.year;

    ["A1", "A2", "A3"].forEach((cell, i) => {
        const c = worksheet.getCell(cell);
        c.font = {
            bold: true,
            size: i === 0 ? 14 : i === 1 ? 12 : 10,
            italic: i === 2,
        };
        c.alignment = { horizontal: "center", vertical: "middle" };
    });

    // =========================
    // META INFO
    // =========================
    worksheet.getCell("A5").value = "Batch No: "+ batch.batch_name;
    worksheet.getCell("H5").value = "Content Source:";
    worksheet.getCell("I5").value = batch.content_source;
    worksheet.getCell("H6").value = "Date Generated:";
    worksheet.getCell("I6").value = dateStr;

    // =========================
    // HEADERS
    // =========================
    const headers = [
        "Holdings ID",
        "Content Type",
        "Title",
        "Source",
        "Journal Title",
        "Abstract",
        "Author",
        "Volume No",
        "Issue No",
        "Issue Date",
    ];

    const headerRowIndex = 8;
    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.values = headers;

    headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9D9D9" },
        };
        cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
        };
        cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
        };
    });
    const dataStartRow = headerRowIndex + 1;

    records.forEach((r, index) => {
        const row = worksheet.getRow(dataStartRow + index);

        row.values = [
            r.HoldingsID,
            r.MaterialType,
            r.Title,
            r.AgencyCode,
            r.JournalTitle,
            r.Abstracts,
            r.Author,
            r.VolumeNo,
            r.IssueNo,
            r.IssueDate,
        ];

        row.eachCell((cell) => {
            cell.alignment = { vertical: "top", wrapText: true };
            cell.border = {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
            };
        });
    });

    // =========================
    // COLUMN WIDTHS
    // =========================
    worksheet.columns = [
        { width: 25 },
        { width: 15 },
        { width: 60 },
        { width: 15 },
        { width: 40 },
        { width: 50 },
        { width: 25 },
        { width: 16 },
        { width: 12 },
        { width: 12 },
    ];

    // =========================
    // SIGNATURE SECTION
    // =========================
    const lastDataRow = dataStartRow + records.length - 1;
    const signStartRow = lastDataRow + 3;

    const signData = [
        ["Prepared by:", "", "Reviewed by:", "", "Noted by:", "", "Approved by:", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        [
            "PRECIOUS T. BIRAQUIT", "",
            "LOUELLA L. PESTAÑO", "",
            "MARIEVIC V. NARQUITA", "",
            "ALAN C. TAULE", "",
            "", ""
        ],
        [
            "Science Research Specialist I", "",
            "Science Research Specialist II", "",
            "Supervising Science Research Specialist", "",
            "IRAD Chief", "",
            "", ""
        ],
        [
            "Date: ___________________", "",
            "Date: ___________________", "",
            "Date: ___________________", "",
            "Date: ___________________", "",
            "", ""
        ],
    ];

    signData.forEach((rowData, i) => {
        worksheet.getRow(signStartRow + i).values = rowData;
    });

    // A–B, C–D, E–F, G–H
    [1, 3, 5, 7].forEach((col) => {
        for (let i = 0; i < 5; i++) {
            worksheet.mergeCells(signStartRow + i, col, signStartRow + i, col + 1);
        }
    });

    // Alignment + bold names
    [1, 3, 5, 7].forEach((col) => {
        [0, 2, 3, 4].forEach((offset) => {
            const cell = worksheet.getCell(signStartRow + offset, col);
            cell.alignment = { horizontal: "center", vertical: "middle" };

            if (offset === 2) {
                cell.font = { bold: true };
            }
        });
    });
    // =========================
    // DOWNLOAD (NO file-saver)
    // =========================
    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
        type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `ShortListed_${batchName}.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};