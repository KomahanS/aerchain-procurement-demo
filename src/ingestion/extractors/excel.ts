import ExcelJS from "exceljs";
import type { SheetSummary } from "../types";
import type { ExtractorOutput } from "./text";

const CELL_DELIMITER = "\t";

/**
 * Extracts every sheet as delimited text (one row per line, cells joined by
 * tabs), preserving the vendor's raw cell text verbatim -- no formula
 * evaluation beyond what the workbook already cached, no reinterpretation.
 */
export async function extractExcel(buffer: Buffer): Promise<ExtractorOutput> {
  const workbook = new ExcelJS.Workbook();
  // exceljs's own type declarations redeclare the global `Buffer` interface
  // to extend `ArrayBuffer`, which conflicts with @types/node's Buffer and
  // makes a plain Node Buffer fail structural typing here at compile time
  // only; the runtime call is unaffected.
  // @ts-expect-error -- see comment above.
  await workbook.xlsx.load(buffer);

  const sheets: SheetSummary[] = [];
  const sheetTexts: string[] = [];

  workbook.eachSheet((worksheet) => {
    const lines: string[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push(cell.text ?? "");
      });
      lines.push(cells.join(CELL_DELIMITER));
    });

    sheets.push({
      name: worksheet.name,
      rowCount: worksheet.actualRowCount,
      columnCount: worksheet.actualColumnCount,
    });
    sheetTexts.push(`=== Sheet: ${worksheet.name} ===\n${lines.join("\n")}`);
  });

  const warnings =
    sheets.length === 0 ? ["Workbook contains no sheets with data."] : [];

  return {
    rawContent: { kind: "structured-text", text: sheetTexts.join("\n\n"), sheets },
    warnings,
  };
}
