import React from 'react';
import { RecurringOrderTemplate } from '../../types';

interface RecurringOrdersListProps {
  templates: RecurringOrderTemplate[];
  onEdit: (template: RecurringOrderTemplate) => void;
  onDelete: (templateId: number) => void;
}

export const RecurringOrdersList: React.FC<RecurringOrdersListProps> = ({ templates, onEdit, onDelete }) => {
    
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre de Plantilla</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">N° de Items</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {templates.map((template) => (
            <tr key={template.id} className="hover:bg-slate-50">
              <td className="py-4 px-4 text-sm font-medium text-slate-900">{template.name}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{template.description || '-'}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{template.items.length}</td>
              <td className="py-4 px-4 text-sm text-slate-600">
                <div className="flex space-x-2">
                    <button onClick={() => onEdit(template)} className="text-blue-600 hover:text-blue-900 font-medium">Editar</button>
                    <button onClick={() => onDelete(template.id)} className="text-red-600 hover:text-red-900 font-medium">Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        {templates.length === 0 && (
            <div className="text-center py-10 text-slate-500">
                <p>No hay plantillas de pedidos recurrentes. Cree una para agilizar las solicitudes.</p>
            </div>
        )}
    </div>
  );
};