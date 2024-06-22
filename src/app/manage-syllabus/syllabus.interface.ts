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

export const sample2: SyllabusNode[] = [
    {
        "id": "standard-1719035045889",
        "name": "Standard 5",
        "children": [
            {
                "id": "new-board-1719035053955",
                "name": "CBSE",
                "children": [
                    {
                        "id": "new-subject-1719035064088",
                        "name": "Science",
                        "children": [
                            {
                                "id": "new-chapter-1719035098222",
                                "name": "Chapter 1. Super Senses",
                                "children": []
                            },
                            {
                                "id": "new-chapter-1719035109722",
                                "name": "Chapter 2. A Snake Charmer’s Story",
                                "children": []
                            },
                            {
                                "id": "new-chapter-1719035119022",
                                "name": "Chapter 3. From Tasting to Digesting",
                                "children": []
                            }
                        ]
                    },
                    {
                        "id": "new-subject-1719035072440",
                        "name": "Maths",
                        "children": []
                    },
                    {
                        "id": "new-subject-1719035080456",
                        "name": "English",
                        "children": []
                    },
                    {
                        "id": "new-subject-1719035087722",
                        "name": "Hindi",
                        "children": []
                    }
                ]
            }
        ]
    }
];

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
