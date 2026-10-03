export interface CaseRecord {
  id: string;
  title: string;
  reference: string;
  gist: string;
  ioName: string;
  updatedAt: number;
}

export interface MasterTemplateRecord {
  slotId: 'kyc' | 'cdr' | 'imei' | 'ipdr' | 'google';
  displayName: string;
  fileName: string;
  fileData?: Blob;
  updatedAt: number;
}

export interface RecentRequisitionRecord {
  id: string;
  generatorType: 'kyc' | 'cdr' | 'imei' | 'ipdr' | 'google';
  generatorTitle: string;
  caseId: string;
  caseTitle: string;
  caseReference: string;
  ioName: string;
  targetIdentifier: string;
  createdDate: string;
  status: string;
}

const DB_NAME = 'cyber_requisition_db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('cases')) {
        db.createObjectStore('cases', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('master_templates')) {
        db.createObjectStore('master_templates', { keyPath: 'slotId' });
      }
      if (!db.objectStoreNames.contains('requisitions')) {
        db.createObjectStore('requisitions', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Case Vault operations
export async function getAllCases(): Promise<CaseRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('cases', 'readonly');
    const store = transaction.objectStore('cases');
    const request = store.getAll();

    request.onsuccess = () => {
      const cases = (request.result as CaseRecord[]) || [];
      cases.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      resolve(cases);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveCase(caseItem: CaseRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('cases', 'readwrite');
    const store = transaction.objectStore('cases');
    const request = store.put(caseItem);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCase(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('cases', 'readwrite');
    const store = transaction.objectStore('cases');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Master Templates operations
export async function getAllMasterTemplates(): Promise<MasterTemplateRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('master_templates', 'readonly');
    const store = transaction.objectStore('master_templates');
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result as MasterTemplateRecord[]) || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMasterTemplate(record: MasterTemplateRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('master_templates', 'readwrite');
    const store = transaction.objectStore('master_templates');
    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function removeMasterTemplate(slotId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('master_templates', 'readwrite');
    const store = transaction.objectStore('master_templates');
    const request = store.delete(slotId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Requisitions operations
export async function getRecentRequisitions(): Promise<RecentRequisitionRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('requisitions', 'readonly');
    const store = transaction.objectStore('requisitions');
    const request = store.getAll();

    request.onsuccess = () => {
      const records = (request.result as RecentRequisitionRecord[]) || [];
      records.reverse();
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecentRequisition(item: RecentRequisitionRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('requisitions', 'readwrite');
    const store = transaction.objectStore('requisitions');
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecentRequisition(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('requisitions', 'readwrite');
    const store = transaction.objectStore('requisitions');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Initial seed helper if database is clean
export async function seedInitialTemplatesIfEmpty(): Promise<void> {
  const existing = await getAllMasterTemplates();
  if (existing.length === 0) {
    const initialSlots: { slotId: MasterTemplateRecord['slotId']; displayName: string; defaultFileName: string }[] = [
      { slotId: 'kyc', displayName: 'KYC Requisition', defaultFileName: 'Standard_KYC_Master.docx' },
      { slotId: 'cdr', displayName: 'CDR / CAF / SDR', defaultFileName: 'Standard_CDR_CAF_SDR_Master.docx' },
      { slotId: 'imei', displayName: 'IMEI Searching', defaultFileName: 'Standard_IMEI_Searching_Master.docx' },
      { slotId: 'ipdr', displayName: 'IPDR / IP Subscriber Details', defaultFileName: 'Standard_IPDR_Master.docx' },
      { slotId: 'google', displayName: 'Google Notice', defaultFileName: 'Standard_Google_Notice_Master.docx' },
    ];

    for (const slot of initialSlots) {
      await saveMasterTemplate({
        slotId: slot.slotId,
        displayName: slot.displayName,
        fileName: slot.defaultFileName,
        updatedAt: Date.now(),
      });
    }
  }
}
