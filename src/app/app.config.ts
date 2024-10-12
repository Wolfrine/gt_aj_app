import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
    providers: [
        provideClientHydration(),
        provideAnimationsAsync(),
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore()),
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
        })
    ],
};
