import { Injectable } from '@angular/core';
import { 
  collection, 
  query, 
  orderBy, 
  startAfter, 
  limit, 
  getDocs, 
  where, 
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint,
  getCountFromServer // 🔥 REQUIRED for "Page X of Y"
} from 'firebase/firestore';
import { db } from '../firebase'; 

export interface PaginatedResult {
  data: any[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  totalCount: number; // This was missing or undefined before
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor() { }

  async getPaginatedData(
    collectionName: string,
    pageSize: number,
    sortField: string,
    sortOrder: 'asc' | 'desc',
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    searchTerm: string = '',
    filterStatus: string = '',
    filterMethod: string = '',
    filterLocation: string = ''
  ): Promise<PaginatedResult> {
    
    const colRef = collection(db, collectionName);
    const constraints: QueryConstraint[] = [];

    // --- FILTERS ---
    if (filterStatus) constraints.push(where('status', '==', filterStatus));
    if (filterMethod) constraints.push(where('method', '==', filterMethod));
    if (filterLocation) constraints.push(where('location', '==', filterLocation));

    // --- SMART SEARCH ---
    if (searchTerm) {
      const term = searchTerm.trim();
      // Simple ID search for demo - expand if needed
      constraints.push(where('id', '>=', term));
      constraints.push(where('id', '<=', term + '\uf8ff'));
    }

    // --- 1. COUNT TOTAL (Crucial Step) ---
    // We create a separate query just to count ALL matching items
    const countQuery = query(colRef, ...constraints);
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count; // 🔥 This gives us "504" instead of "0"

    // --- 2. GET DATA (Pagination) ---
    // Add sorting (only if not searching, to avoid index errors)
    if (!searchTerm) {
        constraints.push(orderBy(sortField, sortOrder));
    }

    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }
    
    constraints.push(limit(pageSize));

    const finalQuery = query(colRef, ...constraints);
    const snapshot = await getDocs(finalQuery);

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { data, lastVisible, totalCount };
  }
}