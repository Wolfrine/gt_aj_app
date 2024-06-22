import { Component, Inject, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatBottomSheet, MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { SyllabusNode } from './syllabus.interface';
import { SyllabusService } from './syllabus.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTreeModule } from '@angular/material/tree';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';

interface FlatNode {
    expandable: boolean;
    name: string;
    level: number;
    id: string;
    editable: boolean;
}

@Component({
    selector: 'bottom-sheet',
    template: `
    <div>
      <mat-form-field>
        <mat-label>{{data.placeholder}}</mat-label>
        <input matInput #nodeName [value]="data.currentName">
      </mat-form-field>
      <button mat-button (click)="addNode(nodeName.value)">Save</button>
    </div>
  `,
    standalone: true,
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule
    ]
})
export class BottomSheetComponent {
    constructor(
        private _bottomSheetRef: MatBottomSheetRef<BottomSheetComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: { placeholder: string, currentName: string }
    ) { }

    addNode(name: string): void {
        this._bottomSheetRef.dismiss(name);
    }
}

@Component({
    selector: 'app-manage-syllabus',
    templateUrl: './manage-syllabus.component.html',
    styleUrls: ['./manage-syllabus.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatTreeModule,
        MatIconModule,
        MatButtonModule,
        FormsModule,
        ReactiveFormsModule,
        MatBottomSheetModule,
        MatFormFieldModule,
        MatInputModule,
        BottomSheetComponent
    ]
})
export class ManageSyllabusComponent implements OnInit {
    private _transformer = (node: SyllabusNode, level: number): FlatNode => ({
        expandable: !!node.children && node.children.length > 0,
        name: node.name,
        level: level,
        id: node.id,
        editable: false
    });

    treeControl = new FlatTreeControl<FlatNode>(
        node => node.level,
        node => node.expandable
    );

    treeFlattener = new MatTreeFlattener(
        this._transformer,
        node => node.level,
        node => node.expandable,
        node => node.children
    );

    dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    constructor(private _bottomSheet: MatBottomSheet, private syllabusService: SyllabusService) { }

    ngOnInit() {
        this.syllabusService.getSyllabusList().subscribe(data => {
            this.dataSource.data = data;
        });
    }

    hasChild = (_: number, node: FlatNode) => node.expandable;

    addStandard() {
        this.openBottomSheet('New Standard', (name: string) => {
            const newStandard: SyllabusNode = {
                id: 'new-standard-' + Date.now(),
                name: name,
                children: []
            };
            this.syllabusService.updateSyllabus(newStandard).then(() => {
                const data = this.dataSource.data;
                data.push(newStandard);
                this.dataSource.data = data;
            });
        });
    }

    addChild(node: FlatNode) {
        const parentNode = this.treeControl.dataNodes.find(n => n.id === node.id);
        if (!parentNode) {
            return;
        }

        let placeholder: string;
        let addChildToFirestore: (name: string) => Promise<void>;

        switch (parentNode.level) {
            case 0: // Standard level
                placeholder = 'New Board';
                addChildToFirestore = (name: string) => this.syllabusService.addBoardToStandard(parentNode.id, name);
                break;
            case 1: // Board level
                placeholder = 'New Subject';
                addChildToFirestore = (name: string) => {
                    const standardNode = this.getAncestorNode(parentNode, 1);
                    if (!standardNode) {
                        throw new Error('Cannot find the ancestor node');
                    }
                    return this.syllabusService.addSubjectToBoard(standardNode.id, parentNode.name, name);
                };
                break;
            case 2: // Subject level
                placeholder = 'New Chapter';
                addChildToFirestore = (name: string) => {
                    const standardNode = this.getAncestorNode(parentNode, 2);
                    const boardNode = this.getAncestorNode(parentNode, 1);
                    if (!standardNode || !boardNode) {
                        throw new Error('Cannot find the ancestor node');
                    }
                    return this.syllabusService.addChapterToSubject(standardNode.id, boardNode.name, parentNode.name, name);
                };
                break;
            default:
                placeholder = 'New Node';
                addChildToFirestore = (name: string) => Promise.resolve();
        }

        this.openBottomSheet(placeholder, (name: string) => {
            const newNode: SyllabusNode = { id: `new-${placeholder.toLowerCase().replace(' ', '-')}-${Date.now()}`, name: name, children: [] };

            // Find the corresponding SyllabusNode and update its children
            const parentNodeToUpdate = this.findNodeById(this.dataSource.data, parentNode.id);
            if (parentNodeToUpdate) {
                if (!Array.isArray(parentNodeToUpdate.children)) {
                    parentNodeToUpdate.children = [];
                }
                parentNodeToUpdate.children.push(newNode);
            }

            addChildToFirestore(name).then(() => {
                this.updateDataSource();
                this.treeControl.expand(parentNode);
            });
        });
    }

    getAncestorNode(node: FlatNode, levelDifference: number): FlatNode | undefined {
        let ancestorNode: FlatNode | undefined = node;
        for (let i = 0; i < levelDifference; i++) {
            const parentIndex = this.treeControl.dataNodes.findIndex(n => n.id === ancestorNode?.id) - 1;
            ancestorNode = this.treeControl.dataNodes[parentIndex];
            if (!ancestorNode) {
                break;
            }
        }
        return ancestorNode;
    }




    editNode(node: FlatNode) {
        this.openBottomSheet('Edit Node', (name: string) => {
            this.updateNodeName(node, name);
        }, node.name);
    }

    saveNode(node: FlatNode) {
        node.editable = false;
        this.updateDataSource();
    }

    makeEditable(node: SyllabusNode) {
        const flatNode = this.treeControl.dataNodes.find(n => n.id === node.id);
        if (flatNode) {
            flatNode.editable = true;
        }
    }

    updateDataSource() {
        // Update the dataSource to trigger change detection
        const data = this.dataSource.data;
        this.dataSource.data = [...data];
    }

    updateNodeName(node: FlatNode, newName: string) {
        // Update the FlatNode name
        const oldName = node.name;
        node.name = newName;

        // Find the corresponding SyllabusNode and update its name
        const data = this.dataSource.data;
        const nodeToUpdate = this.findNodeById(data, node.id);
        if (nodeToUpdate) {
            nodeToUpdate.name = newName;

            const updateFirestore = () => {
                switch (node.level) {
                    case 0:
                        return this.syllabusService.updateSyllabus(nodeToUpdate);
                    case 1:
                        return this.syllabusService.addBoardToStandard(node.id, newName);
                    case 2:
                        return this.syllabusService.addSubjectToBoard(node.id, node.name, newName);
                    case 3:
                        return this.syllabusService.addChapterToSubject(node.id, node.name, oldName, newName);
                    default:
                        return Promise.resolve();
                }
            };

            updateFirestore().then(() => {
                this.dataSource.data = data;
            });
        }
    }

    findNodeById(nodes: SyllabusNode[], id: string): SyllabusNode | null {
        for (const node of nodes) {
            if (node.id === id) {
                return node;
            }
            if (node.children) {
                const foundNode = this.findNodeById(node.children, id);
                if (foundNode) {
                    return foundNode;
                }
            }
        }
        return null;
    }

    openBottomSheet(placeholder: string, callback: (name: string) => void, currentName: string = ''): void {
        const bottomSheetRef = this._bottomSheet.open(BottomSheetComponent, {
            data: { placeholder: placeholder, currentName: currentName }
        });

        bottomSheetRef.afterDismissed().subscribe((name: string | undefined) => {
            if (name) {
                callback(name);
            }
        });
    }
}
