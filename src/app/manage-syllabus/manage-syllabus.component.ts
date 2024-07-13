import { Component, OnInit } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { SyllabusNode } from './syllabus.interface';
import { SyllabusService } from './syllabus.service';
import { Observable } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTreeModule } from '@angular/material/tree';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FileUploadComponent } from './file-upload/file-upload.component';

interface FlatNode {
    expandable: boolean;
    name: string;
    level: number;
    id: string;
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
        MatFormFieldModule,
        MatInputModule,
        MatTabsModule,
        MatCheckboxModule,
        FileUploadComponent
    ]
})
export class ManageSyllabusComponent implements OnInit {
    private _transformer = (node: SyllabusNode, level: number): FlatNode => ({
        expandable: !!node.children && node.children.length > 0,
        name: node.name,
        level: level,
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

    boards: string[] = [];
    standards: string[] = [];

    dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    constructor(private syllabusService: SyllabusService) { }

    ngOnInit() {
        this.syllabusService.getCompleteSyllabusHierarchy().subscribe(data => {
            this.dataSource.data = data;
        });

        this.syllabusService.getDistinctBoards().subscribe(data => {
            this.boards = data;
        });

        this.syllabusService.getAllStandards().subscribe(data => {
            this.standards = data.map(x => x.name);
        });
    }

    hasChild = (_: number, node: FlatNode) => node.expandable;
}
