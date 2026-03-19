import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout';
import { CompanyKorea } from './pages/company-korea';
import { CompanyJapan } from './pages/company-japan';
import { CompanyVietnam } from './pages/company-vietnam';
import { SalesHistory } from './pages/sales-history';
import { SalesDashboard } from './pages/sales-dashboard';
import { ScheduleManagement } from './pages/schedule-management';
import { SalesPersonnel } from './pages/sales-personnel';
import { SalesPersonnelJapan } from './pages/sales-personnel-japan';
import { SalesPersonnelVietnam } from './pages/sales-personnel-vietnam';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: CompanyKorea },
      { path: 'companies/korea', Component: CompanyKorea },
      { path: 'companies/korea/personnel', Component: SalesPersonnel },
      { path: 'companies/japan', Component: CompanyJapan },
      { path: 'companies/japan/personnel', Component: SalesPersonnelJapan },
      { path: 'companies/vietnam', Component: CompanyVietnam },
      { path: 'companies/vietnam/personnel', Component: SalesPersonnelVietnam },
      { path: 'sales', Component: SalesHistory },
      { path: 'dashboard', Component: SalesDashboard },
      { path: 'schedule', Component: ScheduleManagement },
    ],
  },
]);