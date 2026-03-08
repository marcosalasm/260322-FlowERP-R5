
import React from 'react';
import { Material } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';

interface MaterialsTableProps {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDelete: (materialId: number) => void;
  searchTerm?: string;
}

const HighlightText: React.FC<{ text: string, highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-slate-900 font-bold px-0.5 rounded">{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const MaterialsTable: React.FC<MaterialsTableProps> = ({ materials, onEdit, onDelete, searchTerm = '' }) => {
  const { can } = usePermissions();

  const canEdit = can('database', 'materials', 'edit');
  const canDelete = can('database', 'materials', 'delete');

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 border-l-4 border-primary rounded-r-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs font-bold text-primary uppercase tracking-tight">Nota: Los costos unitarios registrados deben incluir el impuesto de ventas (IVA).</p>
      </div>
      <p className="text-xs text-slate-500 italic mb-2 px-1">Doble clic en una fila para editar el material.</p>
      <table className="min-w-full bg-white border border-slate-200 rounded-lg overflow-hidden">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/2">Nombre del Material</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidad</th>
            <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo Unitario</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Última Actualización</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {materials.map((material) => (
            <tr key={material.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onDoubleClick={() => canEdit && onEdit(material)}>
              <td className="py-4 px-4 text-sm font-medium text-slate-900">
                <div className="flex flex-col">
                  {searchTerm ? (
                    <HighlightText text={material.name} highlight={searchTerm} />
                  ) : (
                    material.name
                  )}
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">CÓDIGO: #{material.id}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-slate-600 font-medium">{material.unit}</td>
              <td className="py-4 px-4 text-sm text-slate-800 text-right font-mono font-bold">
                {material.unitCost ? `¢${Number(material.unitCost).toLocaleString('en-US').replace(/,/g, '\u202F').replace(/\./g, ',')}` : 'N/A'}
              </td>
              <td className="py-4 px-4 text-sm text-slate-600">
                {material.lastUpdated ? new Date(material.lastUpdated).toLocaleDateString('es-CR') : 'N/A'}
              </td>
              <td className="py-4 px-4 text-sm text-slate-600">
                {(canEdit || canDelete) ? (
                  <div className="flex space-x-2">
                    {canEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(material); }} className="text-blue-600 hover:text-blue-900 font-bold transition-colors">Editar</button>}
                    {canDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(material.id); }} className="text-red-500 hover:text-red-700 font-bold transition-colors">Eliminar</button>}
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">Sin acciones</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {materials.length === 0 && (
        <div className="text-center py-20 bg-slate-50 border-x border-b border-slate-200 rounded-b-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-slate-500 font-medium">No se encontraron materiales que coincidan con la búsqueda.</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-primary text-sm font-semibold hover:underline">Limpiar búsqueda o recargar</button>
        </div>
      )}
    </div>
  );
};
