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
import { UnauthorizedComponent } from './common/auth/unauthorized.component';
import { AuthComponent } from './common/auth/auth.component';
import { ManageSyllabusComponent } from './manage-syllabus/manage-syllabus.component';
import { RegisterComponent } from './common/register/register.component';
import { NewRegistrationComponent } from './common/register/new-registration/new-registration.component';
import { RegistrationSubmittedComponent } from './common/register/registration-submitted/registration-submitted.component';
import { ManageUsersComponent } from './common/register/manage-users/manage-users.component';
import { MarkdownComponent } from './common/markdown/markdown.component';
import { BasicQuizComponent } from './dashboard/quiz-module/basic-quiz/basic-quiz.component';
import { ManageQuizDatabankComponent } from './dashboard/quiz-module/manage-quiz-databank/manage-quiz-databank.component';
import { ViewQuizDatabankComponent } from './dashboard/quiz-module/view-quiz-databank/view-quiz-databank.component';
import { AddActivityComponent } from './dashboard/add-activity/add-activity.component';
import { GetLogsComponent } from './common/get-logs/get-logs.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent, data: { title: 'Home' } },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRoles: [], title: 'Dashboard' } },
    { path: 'add-news', component: AddNewsComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRoles: ['admin'], title: 'Add News' } },
    { path: 'login', component: AuthComponent, data: { title: 'Login' } },
    { path: 'view-news/:title', component: ViewNewsComponent, data: { title: 'View News' } },
    { path: 'unauthorized', component: UnauthorizedComponent, data: { title: 'Unauthorized access' } },
    { path: 'manage-syllabus', component: ManageSyllabusComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRoles: ['admin'], title: 'Manage Syllabus' } },
    { path: 'register', component: RegisterComponent, canActivate: [AuthGuard], data: { title: 'Registeration Process' } },
    { path: 'register/new', component: NewRegistrationComponent, canActivate: [AuthGuard], data: { title: 'New Registration' } },
    { path: 'register/submitted', component: RegistrationSubmittedComponent, data: { title: 'New registration submission' } },
    { path: 'manage-users', component: ManageUsersComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRoles: ['admin'], title: 'Manage Users' } },
    { path: 'quiz/basic-quiz', component: BasicQuizComponent, data: { title: 'Basic Quiz' } },
    { path: 'quiz/manage-quiz-databank', component: ManageQuizDatabankComponent, data: { title: 'Manage quiz databank' } },
    { path: 'quiz/view-quiz-databank', component: ViewQuizDatabankComponent, data: { title: 'View quiz databank' } },
    { path: 'add-activity', component: AddActivityComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRoles: ['teacher', 'student', 'admin'], title: 'Add class activity' } },
    { path: 'get-logs', component: GetLogsComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRoles: ['admin'], title: 'Get Logs' } },
    { path: 'documentation', component: MarkdownComponent, data: { title: 'Documentation' } },

    { path: '**', component: Error404Component, data: { title: '404 not found' } }
];



// Sample roles based authentication
// { path: 'admin', component: AdminComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'admin' } },
// { path: 'teacher', component: TeacherComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'teacher' } },
// { path: 'student', component: StudentComponent, canActivate: [AuthGuard, RoleGuard], data: { expectedRole: 'student' } },
