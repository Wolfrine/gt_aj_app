import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, getDocs, writeBatch } from '@angular/fire/firestore';
import { Observable, from, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SyllabusNode } from './syllabus.interface';

@Injectable({
    providedIn: 'root'
})
export class SyllabusService {
    constructor(private firestore: Firestore) { }

    getDistinctBoards(): Observable<{ id: string, name: string }[]> {
        const boardsCollection = collection(this.firestore, 'syllabus/masters/boards');
        return from(getDocs(boardsCollection)).pipe(
            map((snapshot) => {
                return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data()['name'] }));
            })
        );
    }

    getAllStandards(): Observable<SyllabusNode[]> {
        const standardsCollection = collection(this.firestore, 'syllabus/masters/standards');
        return from(getDocs(standardsCollection)).pipe(
            map((snapshot) => {
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SyllabusNode);
            })
        );
    }

    getStandardsByBoard(boardId: string): Observable<{ id: string, name: string }[]> {
        const standardsCollection = collection(this.firestore, 'syllabus/masters/standards');
        return from(getDocs(standardsCollection)).pipe(
            map((snapshot) => {
                const standards = snapshot.docs
                    .filter(doc => doc.data()['boardId'] === boardId)
                    .map(doc => ({ id: doc.id, name: doc.data()['name'] }));
                return standards;
            })
        );
    }

    getSubjectsByStandardAndBoard(standardId: string): Observable<{ id: string, name: string }[]> {
        const subjectsCollection = collection(this.firestore, 'syllabus/masters/subjects');
        return from(getDocs(subjectsCollection)).pipe(
            map((snapshot) => {
                return snapshot.docs
                    .filter(doc => doc.data()['standardId'] === standardId)
                    .map(doc => ({ id: doc.id, name: doc.data()['name'] }));
            })
        );
    }

    getChaptersByStandardBoardAndSubject(subjectId: string): Observable<{ id: string, name: string }[]> {
        const chaptersCollection = collection(this.firestore, 'syllabus/masters/chapters');
        return from(getDocs(chaptersCollection)).pipe(
            map((snapshot) => {
                return snapshot.docs
                    .filter(doc => doc.data()['subjectId'] === subjectId)
                    .map(doc => ({ id: doc.id, name: doc.data()['name'] }));
            })
        );
    }


    getCompleteSyllabusHierarchy(): Observable<SyllabusNode[]> {
        const syllabusMappingsCollection = collection(this.firestore, 'syllabus/syllabus-mapping/mappings');
        return from(getDocs(syllabusMappingsCollection)).pipe(
            switchMap((syllabusSnapshot) => {
                const boardIds = new Set<string>();
                const standardIds = new Set<string>();
                const subjectIds = new Set<string>();
                const chapterIds = new Set<string>();

                syllabusSnapshot.forEach((doc) => {
                    const data = doc.data();
                    boardIds.add(data['boardId']);
                    standardIds.add(data['standardId']);
                    subjectIds.add(data['subjectId']);
                    chapterIds.add(data['chapterId']);
                });

                return forkJoin({
                    boards: from(getDocs(collection(this.firestore, 'syllabus/masters/boards'))).pipe(
                        map((boardsSnapshot) => {
                            const boardsMap: { [key: string]: string } = {};
                            boardsSnapshot.forEach((doc) => {
                                const data = doc.data();
                                if (boardIds.has(doc.id)) {
                                    boardsMap[doc.id] = data['name'];
                                }
                            });
                            return boardsMap;
                        })
                    ),
                    standards: from(getDocs(collection(this.firestore, 'syllabus/masters/standards'))).pipe(
                        map((standardsSnapshot) => {
                            const standardsMap: { [key: string]: string } = {};
                            standardsSnapshot.forEach((doc) => {
                                const data = doc.data();
                                if (standardIds.has(doc.id)) {
                                    standardsMap[doc.id] = data['name'];
                                }
                            });
                            return standardsMap;
                        })
                    ),
                    subjects: from(getDocs(collection(this.firestore, 'syllabus/masters/subjects'))).pipe(
                        map((subjectsSnapshot) => {
                            const subjectsMap: { [key: string]: string } = {};
                            subjectsSnapshot.forEach((doc) => {
                                const data = doc.data();
                                if (subjectIds.has(doc.id)) {
                                    subjectsMap[doc.id] = data['name'];
                                }
                            });
                            return subjectsMap;
                        })
                    ),
                    chapters: from(getDocs(collection(this.firestore, 'syllabus/masters/chapters'))).pipe(
                        map((chaptersSnapshot) => {
                            const chaptersMap: { [key: string]: string } = {};
                            chaptersSnapshot.forEach((doc) => {
                                const data = doc.data();
                                if (chapterIds.has(doc.id)) {
                                    chaptersMap[doc.id] = data['name'];
                                }
                            });
                            return chaptersMap;
                        })
                    ),
                    syllabusSnapshot: of(syllabusSnapshot)
                });
            }),
            map(({ boards, standards, subjects, chapters, syllabusSnapshot }) => {
                const syllabusHierarchy: SyllabusNode[] = [];
                const boardsMap: { [key: string]: SyllabusNode } = {};

                syllabusSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const boardId = data['boardId'];
                    const standardId = data['standardId'];
                    const subjectId = data['subjectId'];
                    const chapterId = data['chapterId'];

                    if (!boardsMap[boardId]) {
                        boardsMap[boardId] = { id: boardId, name: boards[boardId], children: [] };
                    }

                    const board = boardsMap[boardId];
                    let standard = board.children?.find((child) => child.id === standardId);

                    if (!standard) {
                        standard = { id: standardId, name: standards[standardId], children: [] };
                        board.children?.push(standard);
                    }

                    let subject = standard.children?.find((child) => child.id === subjectId);

                    if (!subject) {
                        subject = { id: subjectId, name: subjects[subjectId], children: [] };
                        standard.children?.push(subject);
                    }

                    const chapter = { id: chapterId, name: chapters[chapterId] };
                    subject.children?.push(chapter);
                });

                syllabusHierarchy.push(...Object.values(boardsMap));
                return syllabusHierarchy;
            })
        );
    }

    async clearCollection(collectionPath: string) {
        const collectionRef = collection(this.firestore, collectionPath);
        const docsSnapshot = await getDocs(collectionRef);
        const batch = writeBatch(this.firestore);

        docsSnapshot.forEach((doc) => {
            const docRef = doc.ref;
            batch.delete(docRef);
        });

        await batch.commit();
    }

    async uploadToFirestore(data: any, collectionName: string) {
        const batch = writeBatch(this.firestore);
        for (const key in data) {
            const docRef = doc(this.firestore, `syllabus/masters/${collectionName}/${key}`);
            batch.set(docRef, data[key]);
        }
        await batch.commit();
    }

    async uploadSyllabusToFirestore(data: any) {
        const batch = writeBatch(this.firestore);
        const syllabusCollection = collection(this.firestore, 'syllabus/syllabus-mapping/mappings');
        for (const item of data) {
            const docRef = doc(syllabusCollection);
            batch.set(docRef, item);
        }
        await batch.commit();
    }
}
