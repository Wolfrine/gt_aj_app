export interface SyllabusNode {
    id: string;
    name: string;
    children?: SyllabusNode[];
}

export interface FlatNode {
    expandable: boolean;
    name: string;
    level: number;
}

export const sampleSyllabus: SyllabusNode[] = [
    {
        id: '10',
        name: 'Standard 10',
        children: [
            {
                id: 'icse',
                name: 'ICSE',
                children: [
                    {
                        id: 'math',
                        name: 'Mathematics',
                        children: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                    {
                        id: 'sci',
                        name: 'Science',
                        children: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                ],
            },
            {
                id: 'cbse',
                name: 'CBSE',
                children: [
                    {
                        id: 'eng',
                        name: 'English',
                        children: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                    {
                        id: 'hist',
                        name: 'History',
                        children: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: '11',
        name: 'Standard 11',
        children: [
            {
                id: 'icse',
                name: 'ICSE',
                children: [
                    {
                        id: 'math',
                        name: 'Mathematics',
                        children: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                    {
                        id: 'phy',
                        name: 'Physics',
                        children: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                ],
            },
            {
                id: 'cbse',
                name: 'CBSE',
                children: [
                    {
                        id: 'chem',
                        name: 'Chemistry',
                        children: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                    {
                        id: 'bio',
                        name: 'Biology',
                        children: [
                            { id: 'ch1', name: 'Chapter 1' },
                            { id: 'ch2', name: 'Chapter 2' },
                        ],
                    },
                ],
            },
        ],
    },
];
