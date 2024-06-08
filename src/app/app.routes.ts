import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { NewsEventsComponent } from './news-events/news-events.component';
import { ViewNewsComponent } from './news-events/view-news/view-news.component';
import { AddNewsComponent } from './news-events/add-news/add-news.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { Error404Component } from './error-404/error-404.component';



export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'add-news', component: AddNewsComponent },
    { path: 'view-news/:title', component: ViewNewsComponent },
    { path: '**', component: Error404Component }
];
