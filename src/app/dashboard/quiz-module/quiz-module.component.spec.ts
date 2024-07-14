import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizModuleComponent } from './quiz-module.component';

describe('QuizModuleComponent', () => {
  let component: QuizModuleComponent;
  let fixture: ComponentFixture<QuizModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizModuleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuizModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
