import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageQuizDatabankComponent } from './manage-quiz-databank.component';

describe('ManageQuizDatabankComponent', () => {
  let component: ManageQuizDatabankComponent;
  let fixture: ComponentFixture<ManageQuizDatabankComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageQuizDatabankComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManageQuizDatabankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
