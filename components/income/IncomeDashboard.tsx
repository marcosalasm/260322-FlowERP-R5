import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Card } from '../shared/Card';
import { AccountsReceivableTable } from '../sales/AccountsReceivableTable';
import { AccountReceivable, Payment } from '../../types';
import { AddPaymentModal } from './AddPaymentModal';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import { AppContext } from '../../context/AppContext';
// FIX: Removed non-existent 'parseISO' import. 'new Date()' will be used for parsing.
import { isPast, differenceInDays } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../services/apiService';


const ReminderBanner: React.FC<{
    overdueCount: number;
    upcomingCount: number;
    onDismiss: () => void;
}> = ({ overdueCount, upcomingCount, onDismiss }) => {
    const hasOverdue = overdueCount > 0;
    const color = hasOverdue ? 'red' : 'orange';
    const message = hasOverdue
        ? `Tiene ${overdueCount} cuenta(s) por cobrar vencida(s)${upcomingCount > 0 ? ` y ${upcomingCount} próxima(s) a vencer` : ''}.`
        : `Tiene ${upcomingCount} cuenta(s) por cobrar próxima(s) a vencer en los siguientes 7 días.`;

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
                    <p className={`font-bold text-${color}-800`}>Recordatorio de Cobros</p>
                    <p className={`text-sm text-${color}-700`}>{message}</p>
                </div>
            </div>
            <button onClick={onDismiss} className={`text-${color}-500 hover:text-${color}-700`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
        </div>
    );
};


const IncomeDashboard: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;

    const { accountsReceivable, setAccountsReceivable } = appContext;
    const { addNotification } = useNotifications();
    const { showToast } = useToast();

    const [selectedAccount, setSelectedAccount] = useState<AccountReceivable | null>(null);
    const [isAddPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isReminderVisible, setIsReminderVisible] = useState(true);

    const handleAddPayment = async (accountId: number, paymentData: { amount: number; date: string; details: string; proofAttachmentName?: string; proofAttachmentBase64?: string }) => {
        try {
            const accountToUpdate = accountsReceivable.find(acc => acc.id === accountId);
            if (!accountToUpdate) return;

            const newPayment: Payment = {
                id: (accountToUpdate.payments.length > 0 ? Math.max(...accountToUpdate.payments.map(p => p.id)) : 0) + 1,
                date: paymentData.date,
                amount: paymentData.amount,
                details: paymentData.details || undefined,
                proofAttachmentName: paymentData.proofAttachmentName,
                proofAttachmentBase64: paymentData.proofAttachmentBase64,
            };

            const updatedAccount = {
                ...accountToUpdate,
                payments: [...accountToUpdate.payments, newPayment]
            };

            await apiService.updateAccountReceivable(accountId, updatedAccount);

            setAccountsReceivable(prevAccounts => {
                return prevAccounts.map(acc => {
                    if (acc.id === accountId) {
                        return updatedAccount;
                    }
                    return acc;
                });
            });
            showToast('Pago registrado correctamente', 'success');
        } catch (error) {
            console.error('Error adding payment:', error);
            showToast('Error al registrar el pago', 'error');
        }
        setAddPaymentModalOpen(false);
        setSelectedAccount(null);
    };

    const handleOpenAddPaymentModal = (account: AccountReceivable) => {
        setSelectedAccount(account);
        setAddPaymentModalOpen(true);
    };

    const handleOpenHistoryModal = (account: AccountReceivable) => {
        setSelectedAccount(account);
        setHistoryModalOpen(true);
    };

    const handleSendReminder = (account: AccountReceivable) => {
        showToast(`Recordatorio de cobro enviado a ${account.clientName} (simulado).`, 'info');
    };

    const filteredAccounts = useMemo(() => {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        if (!trimmedSearch) {
            return accountsReceivable;
        }
        return accountsReceivable.filter(account =>
            account.clientName.toLowerCase().includes(trimmedSearch) ||
            account.companyName.toLowerCase().includes(trimmedSearch)
        );
    }, [accountsReceivable, searchTerm]);

    const { overdueReceivables, upcomingReceivables } = useMemo(() => {
        const now = new Date();
        const overdue: AccountReceivable[] = [];
        const upcoming: AccountReceivable[] = [];

        accountsReceivable.forEach(acc => {
            const paidAmount = acc.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const receivableAmount = Number(acc.contractAmount) - paidAmount;

            if (receivableAmount > 0) {
                // FIX: Replaced non-existent 'parseISO' with 'new Date()'.
                const dueDate = new Date(`${acc.paymentDate}T00:00:00`);
                const daysUntilDue = differenceInDays(dueDate, now);

                if (daysUntilDue < 0) {
                    overdue.push(acc);
                } else if (daysUntilDue <= 7) {
                    upcoming.push(acc);
                }
            }
        });
        return { overdueReceivables: overdue, upcomingReceivables: upcoming };
    }, [accountsReceivable]);

    useEffect(() => {
        const overdueCount = overdueReceivables.length;
        const upcomingCount = upcomingReceivables.length;

        if (overdueCount > 0) {
            const message = `Tiene ${overdueCount} cuenta(s) por cobrar vencida(s).`;
            addNotification(message);
            showToast(message, 'error');
        } else if (upcomingCount > 0) {
            const message = `Tiene ${upcomingCount} cuenta(s) por cobrar próxima(s) a vencer.`;
            addNotification(message);
            showToast(message, 'info');
        }
    }, [overdueReceivables.length, upcomingReceivables.length]);


    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-dark-gray">Módulo de Ingresos</h2>
                </div>
                {isReminderVisible && (overdueReceivables.length > 0 || upcomingReceivables.length > 0) && (
                    <ReminderBanner
                        overdueCount={overdueReceivables.length}
                        upcomingCount={upcomingReceivables.length}
                        onDismiss={() => setIsReminderVisible(false)}
                    />
                )}
                <Card title="Cuentas por Cobrar">
                    <div className="mb-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar por cliente o empresa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full max-w-md p-2 pl-10 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label="Buscar proyectos"
                            />
                        </div>
                    </div>
                    <AccountsReceivableTable
                        accounts={filteredAccounts}
                        onAddPayment={handleOpenAddPaymentModal}
                        onViewHistory={handleOpenHistoryModal}
                        onSendReminder={handleSendReminder}
                    />
                </Card>
            </div>

            {selectedAccount && (
                <AddPaymentModal
                    isOpen={isAddPaymentModalOpen}
                    onClose={() => setAddPaymentModalOpen(false)}
                    account={selectedAccount}
                    onSubmit={handleAddPayment}
                />
            )}

            {selectedAccount && (
                <PaymentHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setHistoryModalOpen(false)}
                    account={selectedAccount}
                />
            )}
        </>
    );
};

export default IncomeDashboard;