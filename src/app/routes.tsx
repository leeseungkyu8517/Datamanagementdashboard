import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout';
import { CompanyKorea } from './pages/company-korea';
import { CompanyJapan } from './pages/company-japan';
import { CompanyVietnam } from './pages/company-vietnam';
import { SalesHistory } from './pages/sales-history';
import { SalesDashboard } from './pages/sales-dashboard';
import { PeriodForecastDashboard } from './pages/period-forecast-dashboard';
import { ScheduleManagement } from './pages/schedule-management';
import { SalesPersonnel } from './pages/sales-personnel';
import { SalesPersonnelJapan } from './pages/sales-personnel-japan';
import { SalesPersonnelVietnam } from './pages/sales-personnel-vietnam';
import { CompanyDataCollection } from './pages/company-data-collection';
import { MyTasks } from './pages/my-tasks';
import { MeetingPrep } from './pages/meeting-prep';
import { Documents } from './pages/documents';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: MyTasks },
      { path: 'companies/korea', Component: CompanyKorea },
      { path: 'companies/korea/personnel', Component: SalesPersonnel },
      { path: 'companies/japan', Component: CompanyJapan },
      { path: 'companies/japan/personnel', Component: SalesPersonnelJapan },
      { path: 'companies/vietnam', Component: CompanyVietnam },
      { path: 'companies/vietnam/personnel', Component: SalesPersonnelVietnam },
      { path: 'sales', Component: SalesHistory },
      { path: 'company-data', Component: CompanyDataCollection },
      { path: 'my-tasks', Component: MyTasks },
      { path: 'dashboard', Component: SalesDashboard },
      { path: 'period-forecast', Component: PeriodForecastDashboard },
      { path: 'schedule', Component: ScheduleManagement },
      { path: 'meeting-prep', Component: MeetingPrep },
      { path: 'documents', Component: Documents },
    ],
  },
]);