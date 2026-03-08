import React from 'react';
import { Prospect } from '../../types';
import { differenceInDays, isToday, isPast } from 'date-fns';

interface ProspectsTableProps {
  prospects: Prospect[];
  onSelectProspect: (prospect: Prospect) => void;
}

export const ProspectsTable: React.FC<ProspectsTableProps> = ({ prospects, onSelectProspect }) => {

  const getFollowUpDateStyling = (dateStr: string) => {
    if (!dateStr) return 'text-slate-600';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'text-slate-600';

    const today = new Date();
    const daysDiff = differenceInDays(date, today);

    if (isPast(date) && !isToday(date)) {
      return 'bg-red-100 text-red-800 font-semibold'; // Overdue
    }
    if (daysDiff >= 0 && daysDiff <= 3) {
      return 'bg-yellow-100 text-yellow-800 font-semibold'; // Due soon
    }
    return 'text-slate-600';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Correo Electrónico</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Próximo Seguimiento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {prospects.map((prospect) => (
            <tr key={prospect.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onSelectProspect(prospect)}>
              <td className="py-4 px-4 text-sm font-medium text-slate-900">{prospect.name}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{prospect.company}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{prospect.phone}</td>
              <td className="py-4 px-4 text-sm text-primary hover:underline"><a href={`mailto:${prospect.email}`} onClick={e => e.stopPropagation()}>{prospect.email}</a></td>
              <td className="py-4 px-4 text-sm">
                {prospect.nextFollowUpDate ? (
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 rounded-full ${getFollowUpDateStyling(prospect.nextFollowUpDate)}`}>
                    {(() => {
                      const d = new Date(prospect.nextFollowUpDate);
                      return !isNaN(d.getTime()) ? d.toLocaleDateString() : 'Fecha no válida';
                    })()}
                  </span>
                ) : (
                  <span className="text-slate-400">Sin seguimiento</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {prospects.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <p>No hay prospectos registrados. ¡Comienza agregando uno!</p>
        </div>
      )}
    </div>
  );
};