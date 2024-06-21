import { Routes } from '@angular/router';
import { AuthGuard } from './common/auth/auth.gaurd';
import { RoleGuard } from './common/auth/role.guard';
import { AppComponent } from './app.component';
import { NewsEventsComponent } from './news-events/news-events.component';
import { ViewNewsComponent } from './news-events/view-news/view-news.component';
import { AddNewsComponent } from './news-events/add-news/add-news.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { Error404Component } from './common/error-404/error-404.component';
import { UnauthorizedComponent } from './common/unauthorized.component';
import { AuthComponent } from './common/auth/auth.component';
import { ManageSyllabusComponent } from './manage-syllabus/manage-syllabus.component';



export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'add-news', component: AddNewsComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRole: ['admin'] } },
    { path: 'login', component: AuthComponent },
    { path: 'view-news/:title', component: ViewNewsComponent },
    { path: 'unauthorized', component: UnauthorizedComponent },
    { path: 'manage-syllabus', component: ManageSyllabusComponent },
    { path: '**', component: Error404Component }
];


// Sample roles based authentication
// { path: 'admin', component: AdminComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'admin' } },
// { path: 'teacher', component: TeacherComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'teacher' } },
// { path: 'student', component: StudentComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'student' } },
