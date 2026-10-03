import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export interface KycReplacementData {
  memoNo: string;
  date: string;
  caseReference: string;
  bankName: string;
  accountNo: string;
  statementFromDate: string;
  ioName: string;
}

export interface CdrReplacementData {
  caseReference: string;
  caseGist: string;
  ioName: string;
  requisitionType: string;
  mobileNumber: string;
  fromDate: string;
  toDate: string;
}

export interface ImeiReplacementData {
  caseReference: string;
  ioName: string;
  imeiNumber: string;
  fromDate: string;
  toDate: string;
}

export interface IpdrReplacementData {
  caseReference: string;
  ioName: string;
  dataRequired: string;
}

export interface GoogleNoticeReplacementData {
  emailId: string;
  caseReference: string;
  caseGist: string;
  ioName: string;
  date: string;
}

/**
 * Replaces placeholders in a given master DOCX blob using Docxtemplater
 * preserving formatting, headers, logos, margins, spacing, alignment, and page layout.
 */
async function processDocxBlob(
  templateBlob: Blob,
  replacementValues: Record<string, string>
): Promise<Blob> {
  const arrayBuffer = await templateBlob.arrayBuffer();
  const zip = new PizZip(arrayBuffer);

  const doc = new Docxtemplater(zip, {
    delimiters: { start: '{{', end: '}}' },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  });

  doc.render(replacementValues);

  return doc.getZip().generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

/**
 * Replaces ONLY the specified KYC placeholders in the uploaded KYC master DOCX
 */
export async function generateKycDocx(
  templateBlob: Blob,
  data: KycReplacementData
): Promise<Blob> {
  return processDocxBlob(templateBlob, {
    MEMO_NO: data.memoNo || '',
    DATE: data.date || '',
    CASE_REFERENCE: data.caseReference || '',
    BANK_NAME: data.bankName || '',
    ACCOUNT_NO: data.accountNo || '',
    STATEMENT_FROM_DATE: data.statementFromDate || '',
    IO_NAME: data.ioName || '',
  });
}

/**
 * Replaces ONLY the specified CDR / CAF / SDR placeholders
 */
export async function generateCdrDocx(
  templateBlob: Blob,
  data: CdrReplacementData
): Promise<Blob> {
  return processDocxBlob(templateBlob, {
    CASE_REFERENCE: data.caseReference || '',
    CASE_GIST: data.caseGist || '',
    IO_NAME: data.ioName || '',
    REQUISITION_TYPE: data.requisitionType || '',
    MOBILE_NUMBER: data.mobileNumber || '',
    FROM_DATE: data.fromDate || '',
    TO_DATE: data.toDate || '',
  });
}

/**
 * Replaces ONLY the specified IMEI Searching placeholders
 */
export async function generateImeiDocx(
  templateBlob: Blob,
  data: ImeiReplacementData
): Promise<Blob> {
  return processDocxBlob(templateBlob, {
    CASE_REFERENCE: data.caseReference || '',
    IO_NAME: data.ioName || '',
    IMEI_NUMBER: data.imeiNumber || '',
    FROM_DATE: data.fromDate || '',
    TO_DATE: data.toDate || '',
  });
}

/**
 * Replaces ONLY the specified IPDR / IP Subscriber Details placeholders
 */
export async function generateIpdrDocx(
  templateBlob: Blob,
  data: IpdrReplacementData
): Promise<Blob> {
  return processDocxBlob(templateBlob, {
    CASE_REFERENCE: data.caseReference || '',
    IO_NAME: data.ioName || '',
    DATA_REQUIRED: data.dataRequired || '',
  });
}

/**
 * Replaces ONLY the specified Google Notice placeholders
 */
export async function generateGoogleNoticeDocx(
  templateBlob: Blob,
  data: GoogleNoticeReplacementData
): Promise<Blob> {
  return processDocxBlob(templateBlob, {
    EMAIL_ID: data.emailId || '',
    CASE_REFERENCE: data.caseReference || '',
    CASE_GIST: data.caseGist || '',
    IO_NAME: data.ioName || '',
    DATE: data.date || '',
  });
}

export function downloadDocxBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
