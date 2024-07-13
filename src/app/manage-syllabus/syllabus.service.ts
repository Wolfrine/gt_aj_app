import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDocs, writeBatch } from '@angular/fire/firestore';
import { Observable, map, from, switchMap, forkJoin, of } from 'rxjs';
import { SyllabusNode } from './syllabus.interface';

@Injectable({
    providedIn: 'root'
})
export class SyllabusService {
    constructor(private firestore: Firestore) { }

    getDistinctBoards(): Observable<string[]> {
        const boardsCollection = collection(this.firestore, 'boards');
        return from(getDocs(boardsCollection)).pipe(
            map((boardsSnapshot) => {
                const boardsSet = new Set<string>();
                boardsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data['name']) {
                        boardsSet.add(data['name']);
                    }
                });
                return Array.from(boardsSet);
            })
        );
    }

    getSubjectsByStandardAndBoard(standardId: string, boardName: string): Observable<string[]> {
        const subjectsCollection = collection(this.firestore, 'subjects');
        return from(getDocs(subjectsCollection)).pipe(
            map((subjectsSnapshot) => {
                const subjectsSet = new Set<string>();
                subjectsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data['standardId'] === standardId && data['name'] && data['boardId'] === boardName) {
                        subjectsSet.add(data['name']);
                    }
                });
                return Array.from(subjectsSet);
            })
        );
    }

    async getChaptersByStandardBoardAndSubject(standardId: string, boardName: string, subjectName: string): Promise<SyllabusNode[]> {
        const chaptersCollection = collection(this.firestore, 'chapters');
        const chaptersSnapshot = await getDocs(chaptersCollection);
        const chapters: SyllabusNode[] = [];

        chaptersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data['subjectId'] === `${subjectName}_${standardId}` && data['name']) {
                chapters.push({ id: doc.id, name: data['name'] });
            }
        });

        return chapters;
    }

    getAllStandards(): Observable<SyllabusNode[]> {
        const standardsCollection = collection(this.firestore, 'standards');
        return from(getDocs(standardsCollection)).pipe(
            map((standardsSnapshot) => {
                return standardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SyllabusNode[];
            })
        );
    }

    getCompleteSyllabusHierarchy(): Observable<SyllabusNode[]> {
        const syllabusCollection = collection(this.firestore, 'syllabus');
        const boardsCollection = collection(this.firestore, 'boards');
        const standardsCollection = collection(this.firestore, 'standards');
        const subjectsCollection = collection(this.firestore, 'subjects');
        const chaptersCollection = collection(this.firestore, 'chapters');

        return from(getDocs(syllabusCollection)).pipe(
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
                    boards: from(getDocs(boardsCollection)).pipe(
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
                    standards: from(getDocs(standardsCollection)).pipe(
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
                    subjects: from(getDocs(subjectsCollection)).pipe(
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
                    chapters: from(getDocs(chaptersCollection)).pipe(
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

                syllabusSnapshot.forEach((doc: { data: () => any; }) => {
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


    async uploadToFirestore(data: any, collectionName: string) {
        const batch = writeBatch(this.firestore);
        for (const key in data) {
            const docRef = doc(this.firestore, collectionName, key);
            batch.set(docRef, data[key]);
        }
        await batch.commit();
    }

    async uploadSyllabusToFirestore(data: any) {
        const batch = writeBatch(this.firestore);
        const syllabusCollection = collection(this.firestore, 'syllabus');
        for (const item of data) {
            const docRef = doc(syllabusCollection);
            batch.set(docRef, item);
        }
        await batch.commit();
    }
}
