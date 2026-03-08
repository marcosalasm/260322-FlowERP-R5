import React from 'react';
import { LaborItem } from '../../types';

interface LaborTableProps {
  laborItems: LaborItem[];
  onEdit: (item: LaborItem) => void;
  onDelete: (itemId: number) => void;
}

export const LaborTable: React.FC<LaborTableProps> = ({ laborItems, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/2">Nombre del Puesto</th>
            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Salario por Hora</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Moneda</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {laborItems.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="py-4 px-4 text-sm font-medium text-slate-900">{item.name}</td>
              <td className="py-4 px-4 text-sm text-slate-800 text-right font-mono">
                {item.currency === 'CRC' ? '¢' : '$'}{item.hourlyRate.toLocaleString('en-US', { minimumFractionDigits: 2 }).replace(/,/g, '\u202F').replace(/\./g, ',')}
              </td>
              <td className="py-4 px-4 text-sm text-slate-600">{item.currency}</td>
              <td className="py-4 px-4 text-sm text-slate-600">
                <div className="flex space-x-2">
                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 font-medium">Editar</button>
                    <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900 font-medium">Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {laborItems.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <p>No hay puestos de mano de obra registrados.</p>
        </div>
      )}
    </div>
  );
};
