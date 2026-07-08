import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/login/login').then((m) => m.LoginComponent)
  },
  {
    path: 'intranet',
    loadComponent: () =>
      import('./shared/layouts/intranet-layout/intranet-layout').then((m) => m.IntranetLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/home/dashboard-home').then((m) => m.DashboardHomeComponent)
      },
      {
        path: 'almacen',
        loadComponent: () =>
          import('./modules/almacen/home/almacen-home').then((m) => m.AlmacenHomeComponent)
      },
      {
        path: 'catalogo-dci',
        loadComponent: () =>
          import('./modules/dci-catalog/home/dci-catalog-home').then((m) => m.DciCatalogHomeComponent)
      },
      {
        path: 'medicamentos',
        loadComponent: () =>
          import('./modules/medicine-catalog/home/medicine-catalog-home').then((m) => m.MedicineCatalogHomeComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];