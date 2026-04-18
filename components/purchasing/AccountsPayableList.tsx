import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { AccountPayable, APStatus } from '../../types';
// FIX: Removed non-existent 'parseISO' import. 'new Date()' will be used for parsing.
import { isPast, differenceInDays } from 'date-fns';
import { AP_STATUS_COLORS } from '../../constants';
import { usePermissions } from '../../hooks/usePermissions';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/format';

interface AccountsPayableListProps {
  accounts: AccountPayable[];
  onAddPayment: (account: AccountPayable) => void;
  onViewHistory: (account: AccountPayable) => void;
}

const ReminderBanner: React.FC<{
  overdueCount: number;
  upcomingCount: number;
  onDismiss: () => void;
  onNotify: () => void;
}> = ({ overdueCount, upcomingCount, onDismiss, onNotify }) => {
  const hasOverdue = overdueCount > 0;
  const color = hasOverdue ? 'red' : 'orange';
  const message = hasOverdue
    ? `Tiene ${overdueCount} factura(s) vencida(s)${upcomingCount > 0 ? ` y ${upcomingCount} próxima(s) a vencer` : ''}.`
    : `Tiene ${upcomingCount} factura(s) próxima(s) a vencer en los siguientes 7 días.`;

  const Icon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-${color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className={`p-4 mb-4 border-l-4 rounded-r-lg flex items-center justify-between bg-${color}-50 border-${color}-500`}>
      <div className="flex items-center">
        <Icon />
        <div className="ml-3">
          <p className={`font-bold text-${color}-800`}>Recordatorio de Pagos</p>
          <p className={`text-sm text-${color}-700`}>{message}</p>
        </div>
      </div>
      <div className="flex items-center">
        <button onClick={onNotify} className={`text-sm font-medium text-${color}-800 bg-${color}-200 hover:bg-${color}-300 px-3 py-1 rounded-md mr-4 transition-colors`}>
          Notificar a Finanzas
        </button>
        <button onClick={onDismiss} className={`text-${color}-500 hover:text-${color}-700`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        </button>
      </div>
    </div>
  );
};

export const AccountsPayableList: React.FC<AccountsPayableListProps> = ({ accounts, onAddPayment, onViewHistory }) => {
  const appContext = useContext(AppContext);
  const { can } = usePermissions();
  const { addNotification } = useNotifications();
  const { showToast } = useToast();
  const [isReminderVisible, setIsReminderVisible] = useState(true);

  if (!appContext) return null;

  const canPay = can('purchasing', 'payables', 'create');

  const enrichedAccountsPayable = useMemo(() => {
    return accounts.map(ap => {
      // FIX: Replaced non-existent 'parseISO' with 'new Date()'.
      const dueDate = new Date(`${ap.dueDate}T00:00:00`);
      const isOverdue = isPast(dueDate) && ap.status !== APStatus.Paid && ap.status !== APStatus.PartiallyPaid;
      const status = isOverdue ? APStatus.Overdue : ap.status;
      return { ...ap, status };
    }).sort((a, b) => new Date(`${a.dueDate}T00:00:00`).getTime() - new Date(`${b.dueDate}T00:00:00`).getTime());
  }, [accounts]);

  const { overdueInvoices, upcomingInvoices } = useMemo(() => {
    const now = new Date();
    const overdue: AccountPayable[] = [];
    const upcoming: AccountPayable[] = [];

    (enrichedAccountsPayable || []).forEach(acc => {
      if (acc.status !== APStatus.Paid) {
        const dueDate = new Date(`${acc.dueDate}T00:00:00`);
        const daysUntilDue = differenceInDays(dueDate, now);

        if (daysUntilDue < 0) {
          overdue.push(acc);
        } else if (daysUntilDue <= 7) {
          upcoming.push(acc);
        }
      }
    });
    return { overdueInvoices: overdue, upcomingInvoices: upcoming };
  }, [enrichedAccountsPayable]);

  useEffect(() => {
    // This effect will run once when the component mounts with the initial invoice counts.
    // The dependency array ensures it only re-runs if the number of overdue/upcoming invoices changes.
    const overdueCount = overdueInvoices.length;
    const upcomingCount = upcomingInvoices.length;

    if (overdueCount > 0) {
      const message = `Tiene ${overdueCount} factura(s) por pagar vencida(s).`;
      addNotification(message);
      showToast(message, 'error');
    } else if (upcomingCount > 0) {
      const message = `Tiene ${upcomingCount} factura(s) por pagar próxima(s) a vencer.`;
      addNotification(message);
      showToast(message, 'info');
    }
  }, [overdueInvoices.length, upcomingInvoices.length]);

  const handleSimulateEmail = () => {
    showToast('Recordatorio enviado al departamento de finanzas (simulado).', 'info');
    setIsReminderVisible(false);
  };


  return (
    <>
      {isReminderVisible && (overdueInvoices.length > 0 || upcomingInvoices.length > 0) && (
        <ReminderBanner
          overdueCount={overdueInvoices.length}
          upcomingCount={upcomingInvoices.length}
          onDismiss={() => setIsReminderVisible(false)}
          onNotify={handleSimulateEmail}
        />
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Factura #</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Vencimiento</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto Total</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto Pagado</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Abonos (N.C.)</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {enrichedAccountsPayable.map((ap) => {
              const balance = ap.totalAmount - ap.paidAmount - (ap.creditedAmount || 0);
              return (
                <tr key={ap.id} className="hover:bg-slate-50">
                  <td className="py-4 px-4 text-sm font-medium text-slate-900">{ap.supplierName}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{ap.invoiceNumber}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{new Date(ap.dueDate).toLocaleDateString()}</td>
                  <td className="py-4 px-4 text-sm text-right font-mono text-slate-700">{formatCurrency(ap.totalAmount)}</td>
                  <td className="py-4 px-4 text-sm text-right font-mono text-green-600">{formatCurrency(ap.paidAmount)}</td>
                  <td className="py-4 px-4 text-sm text-right font-mono text-purple-600">-{formatCurrency(ap.creditedAmount || 0)}</td>
                  <td className="py-4 px-4 text-sm text-right font-mono font-semibold text-red-600">{formatCurrency(balance)}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${AP_STATUS_COLORS[ap.status]}`}>
                      {ap.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onAddPayment(ap)}
                        className="text-primary hover:text-primary-dark font-medium text-sm disabled:text-slate-400 disabled:cursor-not-allowed disabled:no-underline"
                        disabled={balance <= 0 || !canPay}
                        title={!canPay ? "No tiene permiso para registrar pagos" : balance <= 0 ? "La cuenta ya está saldada" : "Registrar un nuevo pago"}
                      >
                        Registrar Pago
                      </button>
                      <button
                        onClick={() => onViewHistory(ap)}
                        className="text-slate-500 hover:text-slate-800 font-medium text-sm disabled:text-slate-300"
                        disabled={ap.payments.length === 0 && (ap.appliedCreditNoteIds || []).length === 0}
                      >
                        Ver Pagos
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {enrichedAccountsPayable.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <p>No hay cuentas por pagar que coincidan con los filtros.</p>
          </div>
        )}
      </div>
    </>
  );
};