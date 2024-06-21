import { Component, Inject } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatBottomSheet, MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { SyllabusNode, sampleSyllabus } from './syllabus.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTreeModule } from '@angular/material/tree';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface FlatNode {
    expandable: boolean;
    name: string;
    level: number;
    editable: boolean;
    children?: SyllabusNode[];
    id: string;
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
export class ManageSyllabusComponent {
    private _transformer = (node: SyllabusNode, level: number): FlatNode => ({
        expandable: !!node.children && node.children.length > 0,
        name: node.name,
        level: level,
        editable: false,
        children: node.children,
        id: node.id
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

    constructor(private _bottomSheet: MatBottomSheet) {
        this.dataSource.data = sampleSyllabus;
    }

    hasChild = (_: number, node: FlatNode) => node.expandable;

    addStandard() {
        this.openBottomSheet('New Standard', (name: string) => {
            const newStandard: SyllabusNode = {
                id: 'new-standard-' + Date.now(),
                name: name,
                children: []
            };
            const data = this.dataSource.data;
            data.push(newStandard);
            this.dataSource.data = data;
        });
    }

    addChild(node: FlatNode) {
        const parentNode = this.treeControl.dataNodes.find(n => n.id === node.id);
        if (!parentNode) {
            return;
        }

        let placeholder: string;
        switch (parentNode.level) {
            case 0:
                placeholder = 'New Board';
                break;
            case 1:
                placeholder = 'New Subject';
                break;
            case 2:
                placeholder = 'New Chapter';
                break;
            default:
                placeholder = 'New Node';
        }

        this.openBottomSheet(placeholder, (name: string) => {
            const newNode: SyllabusNode = { id: `new-${placeholder.toLowerCase().replace(' ', '-')}-${Date.now()}`, name: name, children: [] };
            if (!parentNode.children) {
                parentNode.children = [];
            }
            parentNode.children.push(newNode);
            this.updateDataSource();
            this.treeControl.expand(parentNode);
        });
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
        node.name = newName;
        // Find the corresponding SyllabusNode and update its name
        const data = this.dataSource.data;
        const nodeToUpdate = this.findNodeById(data, node.id);
        if (nodeToUpdate) {
            nodeToUpdate.name = newName;
        }
        this.dataSource.data = data;
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
