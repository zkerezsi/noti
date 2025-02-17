import { Routes } from '@angular/router';
import { CounterComponent } from './counter/counter.component';
import { LoginComponent } from './login/login.component';
import { IndexComponent } from './index/index.component';
import { ConnectComponent } from './connect/connect.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: IndexComponent },
  { path: 'connect', component: ConnectComponent },
  // TODO: remove counter once experimentation is over
  { path: 'counter', component: CounterComponent },
];
