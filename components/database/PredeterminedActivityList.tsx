import React from 'react';
import { PredeterminedActivity } from '../../types';

interface PredeterminedActivityListProps {
  activities: PredeterminedActivity[];
  onEdit: (activity: PredeterminedActivity) => void;
  onDelete: (activityId: number) => void;
}

export const PredeterminedActivityList: React.FC<PredeterminedActivityListProps> = ({ activities, onEdit, onDelete }) => {
    
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre de Actividad</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidad Base</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">N° de Sub-Actividades</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {activities.map((activity) => (
            <tr key={activity.id} className="hover:bg-slate-50">
              <td className="py-4 px-4 text-sm font-medium text-slate-900">{activity.name}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{activity.baseUnit}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{activity.subActivities.length}</td>
              <td className="py-4 px-4 text-sm text-slate-600">
                <div className="flex space-x-2">
                    <button onClick={() => onEdit(activity)} className="text-blue-600 hover:text-blue-900 font-medium">Editar</button>
                    <button onClick={() => onDelete(activity.id)} className="text-red-600 hover:text-red-900 font-medium">Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        {activities.length === 0 && (
            <div className="text-center py-10 text-slate-500">
                <p>No hay actividades predeterminadas. Cree una para agilizar la creación de presupuestos.</p>
            </div>
        )}
    </div>
  );
};