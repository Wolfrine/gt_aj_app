import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TilesWithDetailsComponent } from './tiles-with-details.component';

describe('TilesWithDetailsComponent', () => {
  let component: TilesWithDetailsComponent;
  let fixture: ComponentFixture<TilesWithDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TilesWithDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TilesWithDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
