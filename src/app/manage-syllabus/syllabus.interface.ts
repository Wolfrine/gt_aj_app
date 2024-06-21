export interface Chapter {
    id: string;
    name: string;
}

export interface Subject {
    id: string;
    name: string;
    chapters: Chapter[];
}

export interface Board {
    subjects: Subject[];
}

export interface Syllabus {
    id: string;
    name: string;
    boards: { [key: string]: Board };
}


export const sampleSyllabus = [
    {
        id: '10',
        name: 'Standard 10',
        boards: {
            icse: {
                subjects: [
                    {
                        id: 'math',
                        name: 'Mathematics',
                        chapters: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                    {
                        id: 'sci',
                        name: 'Science',
                        chapters: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                ],
            },
            cbse: {
                subjects: [
                    {
                        id: 'eng',
                        name: 'English',
                        chapters: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                    {
                        id: 'hist',
                        name: 'History',
                        chapters: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                ],
            },
        },
    },
    {
        id: '11',
        name: 'Standard 11',
        boards: {
            icse: {
                subjects: [
                    {
                        id: 'math',
                        name: 'Mathematics',
                        chapters: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                    {
                        id: 'phy',
                        name: 'Physics',
                        chapters: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                ],
            },
            cbse: {
                subjects: [
                    {
                        id: 'chem',
                        name: 'Chemistry',
                        chapters: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                    {
                        id: 'bio',
                        name: 'Biology',
                        chapters: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                ],
            },
        },
    },
];
