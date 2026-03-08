
import React from 'react';
import { Supplier } from '../../types';

interface SuppliersTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: number) => void;
}

export const SuppliersTable: React.FC<SuppliersTableProps> = ({ suppliers, onEdit, onDelete }) => {
    
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Bien o Servicio</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ubicación</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Correo</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuenta Bancaria</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className="hover:bg-slate-50">
              <td className="py-4 px-4 text-sm font-medium text-slate-900">{supplier.name}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{supplier.serviceType}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{supplier.location}</td>
              <td className="py-4 px-4 text-sm text-slate-600">{supplier.phone}</td>
              <td className="py-4 px-4 text-sm text-primary hover:underline"><a href={`mailto:${supplier.email}`}>{supplier.email}</a></td>
              <td className="py-4 px-4 text-sm text-slate-600 font-mono">{supplier.bankAccount}</td>
              <td className="py-4 px-4 text-sm text-slate-600">
                <div className="flex space-x-2">
                    <button 
                        onClick={() => onEdit(supplier)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                        Editar
                    </button>
                    <button 
                        onClick={() => onDelete(supplier.id)} 
                        className="text-red-600 hover:text-red-900 font-medium"
                    >
                        Eliminar
                    </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        {suppliers.length === 0 && (
            <div className="text-center py-10 text-slate-500">
                <p>No hay proveedores registrados.</p>
            </div>
        )}
    </div>
  );
};
