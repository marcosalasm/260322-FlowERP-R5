import React from 'react';
import { AccountReceivable } from '../../types';

interface AccountsReceivableTableProps {
  accounts: AccountReceivable[];
  onAddPayment: (account: AccountReceivable) => void;
  onViewHistory: (account: AccountReceivable) => void;
  onSendReminder: (account: AccountReceivable) => void;
}

export const AccountsReceivableTable: React.FC<AccountsReceivableTableProps> = ({ accounts, onAddPayment, onViewHistory, onSendReminder }) => {
  const formatCurrencyValue = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',');
};
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de Vencimiento</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto Contractual</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto Cancelado</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto por Cobrar</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {accounts.map((account) => {
            const paidAmount = account.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const receivableAmount = Number(account.contractAmount) - paidAmount;
            return (
              <tr key={account.id} className="hover:bg-slate-50">
                <td className="py-4 px-4 text-sm font-medium text-slate-900">{account.clientName}</td>
                <td className="py-4 px-4 text-sm text-slate-600">{account.companyName}</td>
                <td className="py-4 px-4 text-sm text-slate-600">{new Date(account.paymentDate).toLocaleDateString()}</td>
                <td className="py-4 px-4 text-sm text-slate-600">¢{formatCurrencyValue(Number(account.contractAmount))}</td>
                <td className="py-4 px-4 text-sm font-semibold text-green-600">¢{formatCurrencyValue(paidAmount)}</td>
                <td className="py-4 px-4 text-sm font-semibold text-red-600">¢{formatCurrencyValue(receivableAmount)}</td>
                <td className="py-4 px-4 text-sm text-slate-600">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onAddPayment(account)}
                      className="text-primary hover:text-primary-dark font-medium text-sm disabled:text-slate-300"
                      disabled={receivableAmount <= 0}
                    >
                      Registrar Pago
                    </button>
                    <button
                      onClick={() => onViewHistory(account)}
                      className="text-slate-500 hover:text-slate-800 font-medium text-sm disabled:text-slate-300"
                      disabled={account.payments.length === 0}
                    >
                      Ver Pagos
                    </button>
                    <button
                      onClick={() => onSendReminder(account)}
                      className="text-secondary hover:text-orange-700 font-medium text-sm disabled:text-slate-300"
                      disabled={receivableAmount <= 0}
                    >
                      Enviar Recordatorio
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {accounts.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <p>No hay cuentas por cobrar pendientes.</p>
        </div>
      )}
    </div>
  );
};
