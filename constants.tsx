import React from 'react';
import { Action } from './types';

const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const ShoppingCartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM17 17h.01M17 13h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 012-2zM7 17h.01M7 13h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM17 7h.01M17 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/>
    </svg>
);
const CashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
    </svg>
);
const DatabaseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7l8-4 8 4M12 11v10"/>
    </svg>
);
const CogIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const ClipboardDocumentListIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08h-1.545a2.25 2.25 0 0 0-2.25 2.25v2.25a2.25 2.25 0 0 0 2.25 2.25h1.545m-4.5-8.25v8.25a2.25 2.25 0 0 0 2.25 2.25h2.25M3 12m0 0a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 12m-18 0v8.25a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 20.25V12M3 12V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75V12" />
    </svg>
);
const BuildingOffice2Icon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m-3-1l-1.5.545m0 0l-2.25 2.25" />
    </svg>
);
const ClipboardDocumentCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-1.12 0-2.024.9-2.024 2.024v13.5c0 1.12.904 2.024 2.024 2.024h9c1.12 0 2.024-.9 2.024-2.024v-9.75M14.25 2.25v4.5h4.5m-10.5-2.25L9 9.375l1.5-1.5L15 12.375" />
    </svg>
);
const TicketIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
);

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, permission: { module: 'dashboard', section: 'main' } },
  { id: 'sales', label: 'Ventas', icon: TagIcon, permission: { module: 'sales', section: 'main' } },
  { id: 'projects', label: 'Proyectos', icon: ClipboardDocumentListIcon, permission: { module: 'projects', section: 'main' } },
  { id: 'income', label: 'Ingresos', icon: CashIcon, permission: { module: 'income', section: 'main' } },
  { id: 'purchasing', label: 'Compras', icon: ShoppingCartIcon, permission: { module: 'purchasing', section: 'main' } },
  { id: 'subcontracts', label: 'Subcontratos', icon: ClipboardDocumentCheckIcon, permission: { module: 'subcontracts', section: 'main' } },
  { 
    id: 'bonos', 
    label: 'Proyectos Recurrentes', 
    icon: TicketIcon, 
    permission: { module: 'bonos', section: 'main' },
    subItems: [
        { id: 'bonos_requisitos', label: 'Gestión de Requisitos' },
        { id: 'bonos_casos', label: 'Gestión del Caso' },
        { id: 'bonos_noprocede', label: 'No Procede' },
    ]
  },
  { id: 'admin_expenses', label: 'Gastos Admin.', icon: BuildingOffice2Icon, permission: { module: 'adminExpenses', section: 'main' } },
  { id: 'database', label: 'Base de Datos', icon: DatabaseIcon, permission: { module: 'database', section: 'main' } },
  { id: 'configuration', label: 'Configuración', icon: CogIcon, permission: { module: 'configuration', section: 'main' } },
];

type PermissionStructureType = {
    [module: string]: {
        label: string;
        sections: {
            [section: string]: {
                label: string;
                actions: Action[];
            };
        };
    };
};

export const PERMISSIONS_STRUCTURE: PermissionStructureType = {
  dashboard: {
    label: 'Dashboard',
    sections: {
      main: { label: 'General', actions: ['view'] }
    }
  },
  sales: {
    label: 'Ventas',
    sections: {
      main: { label: 'Acceso al Módulo', actions: ['view']},
      prospects: { label: 'Prospectos (CRM)', actions: ['view', 'create', 'edit', 'delete', 'export'] },
      budgets: { label: 'Presupuestos', actions: ['view', 'create', 'edit', 'delete', 'export'] },
      offers: { label: 'Control de Ofertas', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
      changeOrders: { label: 'Órdenes de Cambio', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] }
    }
  },
  projects: {
    label: 'Proyectos',
    sections: {
      main: { label: 'Gestión de Proyectos', actions: ['view', 'create', 'edit', 'delete', 'export'] }
    }
  },
  income: {
    label: 'Ingresos',
    sections: {
      main: { label: 'Cuentas por Cobrar', actions: ['view', 'create', 'edit', 'delete', 'export'] }
    }
  },
  purchasing: {
    label: 'Compras',
    sections: {
      main: { label: 'Acceso al Módulo', actions: ['view']},
      requests: { label: 'Solicitudes', actions: ['view', 'create', 'edit', 'approve', 'delete'] },
      quotes: { label: 'Cotizaciones', actions: ['view', 'create', 'edit', 'delete'] },
      orders: { label: 'Órdenes de Compra', actions: ['view', 'create', 'approve', 'delete', 'export'] },
      receipts: { label: 'Recepción de Mercancía', actions: ['view', 'edit'] },
      creditNotes: { label: 'Notas de Crédito', actions: ['view', 'create', 'approve', 'delete'] },
      payables: { label: 'Cuentas por Pagar', actions: ['view', 'create', 'edit', 'export'] }
    }
  },
  subcontracts: {
    label: 'Subcontratos',
    sections: {
        main: { label: 'Gestión de Subcontratos', actions: ['view', 'create', 'edit', 'delete'] }
    }
  },
  bonos: {
    label: 'Proyectos Recurrentes',
    sections: {
        main: { label: 'Acceso al Módulo', actions: ['view', 'create', 'edit', 'delete'] }
    }
  },
  adminExpenses: {
    label: 'Gastos Administrativos',
    sections: {
      main: { label: 'Acceso al Módulo', actions: ['view'] },
      budget: { label: 'Presupuesto Administrativo', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      expenses: { label: 'Gastos Administrativos', actions: ['view', 'create', 'edit', 'delete'] }
    }
  },
  database: {
    label: 'Base de Datos',
    sections: {
      main: { label: 'Acceso al Módulo', actions: ['view']},
      suppliers: { label: 'Proveedores', actions: ['view', 'create', 'edit', 'delete'] },
      materials: { label: 'Materiales', actions: ['view', 'create', 'edit', 'delete', 'export'] },
      inventory: { label: 'Ajuste de Inventario', actions: ['view', 'create'] },
      subcontracts: { label: 'Sub Contratos', actions: ['view', 'create', 'edit', 'delete'] },
      labor: { label: 'Mano de Obra', actions: ['view', 'create', 'edit', 'delete'] },
      recurringOrders: { label: 'Pedidos Recurrentes', actions: ['view', 'create', 'edit', 'delete'] },
      predeterminedActivities: { label: 'Actividades Predeterminadas', actions: ['view', 'create', 'edit', 'delete'] },
    }
  },
  configuration: {
    label: 'Configuración',
    sections: {
      main: { label: 'Acceso al Módulo', actions: ['view']},
      general: { label: 'Configuración General', actions: ['edit'] },
      users: { label: 'Administración de Usuarios', actions: ['view', 'create', 'edit', 'delete'] },
      roles: { label: 'Roles y Privilegios', actions: ['view', 'create', 'edit', 'delete'] }
    }
  }
};


export const SERVICE_REQUEST_STATUS_COLORS: { [key: string]: string } = {
  'Pendiente Aprobación Director': 'bg-yellow-200 text-yellow-800',
  'Pendiente Aprobación Gerente': 'bg-purple-200 text-purple-800',
  'Aprobada para Cotizar': 'bg-blue-200 text-blue-800',
  'Rechazada': 'bg-red-200 text-red-800',
  'En Cotización': 'bg-cyan-200 text-cyan-800',
  'Cotización Lista': 'bg-indigo-200 text-indigo-800',
  'OC Pendiente Aprobación': 'bg-orange-200 text-orange-800',
  'OC Aprobada': 'bg-green-200 text-green-800',
  'Completada': 'bg-gray-400 text-gray-900',
};

export const OFFER_STATUS_COLORS: { [key: string]: string } = {
  'Confección': 'bg-gray-200 text-gray-800',
  'Revisión': 'bg-yellow-200 text-yellow-800',
  'Aprobación': 'bg-green-200 text-green-800',
  'Rechazada': 'bg-red-200 text-red-800',
};

export const CHANGE_ORDER_STATUS_COLORS: { [key: string]: string } = {
  'Pendiente Aprobación': 'bg-yellow-200 text-yellow-800',
  'Aprobada': 'bg-green-200 text-green-800',
  'Rechazada': 'bg-red-200 text-red-800',
};

export const PROJECT_STATUS_COLORS: { [key: string]: string } = {
  'En Ejecución': 'bg-blue-200 text-blue-800',
  'Finalizado': 'bg-green-200 text-green-800',
  'Pausado': 'bg-yellow-200 text-yellow-800',
};

export const CREDIT_NOTE_STATUS_COLORS: { [key: string]: string } = {
  'Pendiente Aprobación': 'bg-yellow-200 text-yellow-800',
  'Aprobada': 'bg-green-200 text-green-800',
  'Rechazada': 'bg-red-200 text-red-800',
};

export const AP_STATUS_COLORS: { [key: string]: string } = {
  'Pendiente de Pago': 'bg-yellow-200 text-yellow-800',
  'Pagada Parcialmente': 'bg-blue-200 text-blue-800',
  'Pagada': 'bg-green-200 text-green-800',
  'Vencida': 'bg-red-200 text-red-800',
};