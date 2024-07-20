import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewQuizDatabankComponent } from './view-quiz-databank.component';

describe('ViewQuizDatabankComponent', () => {
  let component: ViewQuizDatabankComponent;
  let fixture: ComponentFixture<ViewQuizDatabankComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewQuizDatabankComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewQuizDatabankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
