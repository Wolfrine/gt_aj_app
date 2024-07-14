import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicQuizComponent } from './basic-quiz.component';

describe('BasicQuizComponent', () => {
  let component: BasicQuizComponent;
  let fixture: ComponentFixture<BasicQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicQuizComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BasicQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
