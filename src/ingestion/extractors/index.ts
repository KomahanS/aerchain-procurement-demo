import type { SourceFormat } from "@/domain";
import { extractDocx } from "./docx";
import { extractExcel } from "./excel";
import { extractImage } from "./image";
import { extractPdf } from "./pdf";
import { extractText } from "./text";
import type { ExtractorOutput } from "./text";

export type Extractor = (buffer: Buffer, mimeType: string) => Promise<ExtractorOutput>;

export const EXTRACTORS_BY_FORMAT: Partial<Record<SourceFormat, Extractor>> = {
  excel: (buffer) => extractExcel(buffer),
  pdf: (buffer) => extractPdf(buffer),
  docx: (buffer) => extractDocx(buffer),
  image: (buffer, mimeType) => extractImage(buffer, mimeType),
  email: (buffer) => extractText(buffer),
};

export type { ExtractorOutput } from "./text";
