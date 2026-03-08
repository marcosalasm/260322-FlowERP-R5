import React, { useState, useEffect } from 'react';
import { Role, Permissions } from '../../types';
import { PermissionTree } from './PermissionTree';

interface RoleEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (role: Omit<Role, 'id'> | Role) => void;
    role: Role | null; // null for creating, Role object for editing
}

const initialPermissions: Permissions = {};

export const RoleEditorModal: React.FC<RoleEditorModalProps> = ({ isOpen, onClose, onSave, role }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
    const [maxItemOverage, setMaxItemOverage] = useState<number | string>('');
    const [maxProjectOverage, setMaxProjectOverage] = useState<number | string>('');

    const isEditing = role !== null;

    useEffect(() => {
        if (isOpen) {
            setName(role?.name || '');
            setDescription(role?.description || '');
            setPermissions(role ? JSON.parse(JSON.stringify(role.permissions)) : initialPermissions);
            setMaxItemOverage(role?.maxItemOveragePercentage ?? '');
            setMaxProjectOverage(role?.maxProjectOveragePercentage ?? '');
        }
    }, [isOpen, role]);

    const handleSubmit = () => {
        const roleData = {
            name,
            description,
            permissions,
            isDefault: role?.isDefault || false,
            maxItemOveragePercentage: maxItemOverage === '' ? undefined : Number(maxItemOverage),
            maxProjectOveragePercentage: maxProjectOverage === '' ? undefined : Number(maxProjectOverage),
        };

        if (isEditing) {
            onSave({ ...role, ...roleData });
        } else {
            onSave(roleData);
        }
    };

    if (!isOpen) return null;
    
    const isDefaultRole = role?.isDefault === true;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-dark-gray">{isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>

                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                     {isDefaultRole && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                            <p className="font-bold">Rol por Defecto</p>
                            <p>Los permisos para este rol no se pueden modificar.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="role-name" className="block text-sm font-medium text-slate-700">Nombre del Rol</label>
                            <input
                                type="text"
                                id="role-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isDefaultRole}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 disabled:bg-slate-100"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="role-description" className="block text-sm font-medium text-slate-700">Descripción</label>
                            <input
                                type="text"
                                id="role-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isDefaultRole}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 disabled:bg-slate-100"
                            />
                        </div>
                    </div>
                     {!isDefaultRole && (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold text-dark-gray mb-2">Límites de Aprobación de Excesos</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-md">
                                <div>
                                    <label htmlFor="role-item-overage" className="block text-sm font-medium text-slate-700">Límite de Exceso por Ítem (%)</label>
                                    <input
                                        type="number"
                                        id="role-item-overage"
                                        placeholder="Ej: 10"
                                        value={maxItemOverage}
                                        onChange={(e) => setMaxItemOverage(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">Porcentaje máximo que un solo ítem puede exceder su presupuesto.</p>
                                </div>
                                <div>
                                    <label htmlFor="role-project-overage" className="block text-sm font-medium text-slate-700">Límite de Exceso Total del Proyecto (%)</label>
                                    <input
                                        type="number"
                                        id="role-project-overage"
                                        placeholder="Ej: 5"
                                        value={maxProjectOverage}
                                        onChange={(e) => setMaxProjectOverage(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                    />
                                     <p className="mt-1 text-xs text-slate-500">Porcentaje máximo que el total de excesos puede representar del presupuesto total del proyecto.</p>
                                </div>
                            </div>
                        </div>
                     )}
                    <div>
                        <h3 className="text-lg font-semibold text-dark-gray mb-2">Privilegios</h3>
                        <PermissionTree
                            permissions={permissions}
                            setPermissions={setPermissions}
                            isDisabled={isDefaultRole}
                        />
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-end gap-4 p-6 border-t">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancelar</button>
                    {!isDefaultRole && (
                        <button onClick={handleSubmit} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark">
                            Guardar Rol
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};