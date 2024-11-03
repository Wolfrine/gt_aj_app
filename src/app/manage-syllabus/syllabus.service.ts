import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, getDocs, writeBatch } from '@angular/fire/firestore';
import { Observable, from, forkJoin, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { SyllabusNode } from './syllabus.interface';
import { Logger } from '../logger.service';

@Injectable({
    providedIn: 'root'
})
export class SyllabusService {
    private syllabusCache: BehaviorSubject<SyllabusNode[] | null> = new BehaviorSubject<SyllabusNode[] | null>(null);

    constructor(private firestore: Firestore, private logger: Logger) { }

    loadCompleteSyllabus(): Observable<SyllabusNode[]> {
        if (this.syllabusCache.value) {
            return of(this.syllabusCache.value); // Return cached syllabus
        }

        const syllabusMappingsCollection = collection(this.firestore, 'syllabus/syllabus-mapping/mappings');

        // Log Firestore Read Operation only if data is not cached
        this.logger.addLog({
            type: 'READ',
            module: 'SyllabusService',
            method: 'loadCompleteSyllabus',
            collection: 'syllabus/syllabus-mapping/mappings',
            dataSize: 0,
            timestamp: new Date().toISOString(),
        });

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
                    boards: this.getMasterData('boards', boardIds),
                    standards: this.getMasterData('standards', standardIds),
                    subjects: this.getMasterData('subjects', subjectIds),
                    chapters: this.getMasterData('chapters', chapterIds),
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
                this.syllabusCache.next(syllabusHierarchy);  // Cache the loaded syllabus
                return syllabusHierarchy;
            }),
            catchError(error => {
                console.error("Error loading syllabus:", error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'SyllabusService',
                    method: 'loadCompleteSyllabus',
                    message: `Error loading syllabus: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
                return of([]); // Return empty array on error
            })
        );
    }

    private getMasterData(collectionName: string, ids: Set<string>): Observable<{ [key: string]: string }> {
        const masterCollection = collection(this.firestore, `syllabus/masters/${collectionName}`);
        return from(getDocs(masterCollection)).pipe(
            map(snapshot => {
                const dataMap: { [key: string]: string } = {};
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (ids.has(doc.id)) {
                        dataMap[doc.id] = data['name'];
                    }
                });
                return dataMap;
            }),
            catchError(error => {
                console.error(`Error loading ${collectionName}:`, error);
                this.logger.addLog({
                    type: 'ERROR',
                    module: 'SyllabusService',
                    method: `getMasterData(${collectionName})`,
                    message: `Error loading ${collectionName}: ${error.message}`,
                    timestamp: new Date().toISOString(),
                });
                return of({}); // Return empty object on error
            })
        );
    }


    // Method to ensure syllabus is only loaded once when needed
    ensureSyllabusLoaded(): Observable<SyllabusNode[]> {
        return this.loadCompleteSyllabus();
    }

    getDistinctBoards(): Observable<{ id: string, name: string }[]> {
        return this.syllabusCache.value ?
            of(this.syllabusCache.value.map(board => ({ id: board.id, name: board.name }))) :
            this.loadCompleteSyllabus().pipe(
                map(syllabus => syllabus.map(board => ({ id: board.id, name: board.name })))
            );
    }

    getAllStandards(): Observable<SyllabusNode[]> {
        return this.syllabusCache.value ?
            of(this.syllabusCache.value.flatMap(board => board.children || [])) :
            this.loadCompleteSyllabus().pipe(
                map(syllabus => syllabus.flatMap(board => board.children || []))
            );
    }

    getStandardsByBoard(boardId: string): Observable<{ id: string, name: string }[]> {
        return this.syllabusCache.value ?
            of(this.syllabusCache.value.find(board => board.id === boardId)?.children || []) :
            this.loadCompleteSyllabus().pipe(
                map(syllabus => syllabus.find(board => board.id === boardId)?.children || [])
            );
    }

    getSubjectsByStandardAndBoard(standardId: string): Observable<{ id: string, name: string }[]> {
        return this.syllabusCache.value ?
            of(this.syllabusCache.value.flatMap(board =>
                board.children?.find(standard => standard.id === standardId)?.children || [])) :
            this.loadCompleteSyllabus().pipe(
                map(syllabus => syllabus.flatMap(board =>
                    board.children?.find(standard => standard.id === standardId)?.children || []))
            );
    }

    getChaptersByStandardBoardAndSubject(subjectId: string): Observable<{ id: string, name: string }[]> {
        return this.syllabusCache.value ?
            of(this.syllabusCache.value.flatMap(board =>
                board.children?.flatMap(standard =>
                    (standard.children?.find(subject => subject.id === subjectId)?.children || [])
                ) || []
            ).filter(chapter => chapter !== undefined)
                .map(chapter => ({ id: chapter!.id, name: chapter!.name }))) :
            this.loadCompleteSyllabus().pipe(
                map(syllabus => syllabus.flatMap(board =>
                    board.children?.flatMap(standard =>
                        (standard.children?.find(subject => subject.id === subjectId)?.children || [])
                    ) || []
                ).filter(chapter => chapter !== undefined)
                    .map(chapter => ({ id: chapter!.id, name: chapter!.name })))
            );
    }




    // The rest of your existing methods remain unchanged...

    async clearCollection(collectionPath: string) {
        const collectionRef = collection(this.firestore, collectionPath);
        const docsSnapshot = await getDocs(collectionRef);
        const batch = writeBatch(this.firestore);

        docsSnapshot.forEach((doc) => {
            const docRef = doc.ref;
            batch.delete(docRef);
        });

        await batch.commit();

        // Log Firestore Batch Delete Operation
        this.logger.addLog({
            type: 'BATCH_DELETE',
            module: 'SyllabusService',
            method: 'clearCollection',
            collection: collectionPath,
            dataSize: docsSnapshot.size,
            timestamp: new Date().toISOString(),
        });
    }

    async uploadToFirestore(data: any, collectionName: string) {
        const batch = writeBatch(this.firestore);
        for (const key in data) {
            const docRef = doc(this.firestore, `syllabus/masters/${collectionName}/${key}`);
            batch.set(docRef, data[key]);
        }
        await batch.commit();

        // Log Firestore Batch Write Operation
        this.logger.addLog({
            type: 'BATCH_WRITE',
            module: 'SyllabusService',
            method: 'uploadToFirestore',
            collection: `syllabus/masters/${collectionName}`,
            dataSize: Object.keys(data).length,
            timestamp: new Date().toISOString(),
        });
    }

    async uploadSyllabusToFirestore(data: any) {
        const batch = writeBatch(this.firestore);
        const syllabusCollection = collection(this.firestore, 'syllabus/syllabus-mapping/mappings');
        for (const item of data) {
            const docRef = doc(syllabusCollection);
            batch.set(docRef, item);
        }
        await batch.commit();

        // Log Firestore Batch Write Operation for syllabus
        this.logger.addLog({
            type: 'BATCH_WRITE',
            module: 'SyllabusService',
            method: 'uploadSyllabusToFirestore',
            collection: 'syllabus/syllabus-mapping/mappings',
            dataSize: data.length,
            timestamp: new Date().toISOString(),
        });
    }

    getCompleteSyllabusHierarchy(): Observable<SyllabusNode[]> {
        return this.loadCompleteSyllabus(); // Reuse the method that loads and constructs the syllabus
    }
}
