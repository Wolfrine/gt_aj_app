import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-quiz-timer',
    templateUrl: './quiz-timer.component.html',
    styleUrls: ['./quiz-timer.component.scss'],
    standalone: true,
    imports: [MatProgressSpinnerModule],
})
export class QuizTimerComponent implements OnInit, OnDestroy {
    @Input() timerValue: number = 30;
    @Output() timerEnded = new EventEmitter<void>();
    remainingTime: number = 0;
    spinnerValue: number = 100; // Start at full circle
    intervalId: any;

    ngOnInit(): void {
        this.startSmoothTimer();
    }

    ngOnDestroy(): void {
        if (this.intervalId) clearInterval(this.intervalId);
    }

    startSmoothTimer(): void {
        const updateInterval = 100; // Update every 100ms
        const decrement = (1 / this.timerValue) * (updateInterval / 1000) * 100; // Calculate smooth decrement per tick

        this.remainingTime = this.timerValue;
        this.spinnerValue = 100;

        this.intervalId = setInterval(() => {
            this.remainingTime -= updateInterval / 1000;
            this.spinnerValue -= decrement;

            if (Math.floor(this.remainingTime) <= 0) {
                this.remainingTime = 0;
                this.spinnerValue = 0;
                clearInterval(this.intervalId);
                this.timerEnded.emit();
            }
        }, updateInterval);
    }

    // Format remaining time as an integer for display
    get formattedRemainingTime(): number {
        return Math.floor(this.remainingTime);
    }
}
