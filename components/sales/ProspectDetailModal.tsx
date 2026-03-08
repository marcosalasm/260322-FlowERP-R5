import React, { useState } from 'react';
import { Prospect } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface ProspectDetailModalProps {
    prospect: Prospect;
    onClose: () => void;
    onAddFollowUp: (prospectId: number, comment: string) => void;
    onEdit: () => void;
}

const DetailItem: React.FC<{ label: string, value?: string }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div>
            <dt className="text-sm font-medium text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm text-dark-gray">{value}</dd>
        </div>
    );
};

export const ProspectDetailModal: React.FC<ProspectDetailModalProps> = ({ prospect, onClose, onAddFollowUp, onEdit }) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmitFollowUp = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddFollowUp(prospect.id, newComment.trim());
            setNewComment('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-light-gray">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-gray">{prospect.name}</h2>
                        <p className="text-md text-medium-gray">{prospect.company}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={onEdit} className="text-primary hover:text-primary-dark" aria-label="Editar prospecto">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg>
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[75vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 p-6">
                        {/* Left Column: Details */}
                        <div className="lg:col-span-1 space-y-6">
                            <section>
                                <h3 className="text-lg font-semibold text-dark-gray mb-3">Información de Contacto</h3>
                                <dl className="space-y-3">
                                    <DetailItem label="Teléfono" value={prospect.phone} />
                                    <DetailItem label="Correo Electrónico" value={prospect.email} />
                                </dl>
                            </section>
                            <section>
                                <h3 className="text-lg font-semibold text-dark-gray mb-3">Información Personal</h3>
                                <dl className="space-y-3">
                                    <DetailItem label="Cumpleaños" value={prospect.birthday && !isNaN(new Date(prospect.birthday).getTime()) ? format(new Date(prospect.birthday), "dd 'de' MMMM", { locale: es }) : undefined} />
                                    <DetailItem label="Esposa/o" value={prospect.spouseName} />
                                    <DetailItem label="Hijos" value={prospect.children} />
                                    <DetailItem label="Pasatiempos" value={prospect.hobbies} />
                                </dl>
                            </section>
                        </div>

                        {/* Right Column: Follow-ups */}
                        <div className="lg:col-span-2 mt-6 lg:mt-0">
                            <h3 className="text-lg font-semibold text-dark-gray mb-3">Historial de Seguimiento</h3>
                            <form onSubmit={handleSubmitFollowUp} className="mb-4">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Añadir un nuevo comentario o nota de seguimiento..."
                                    rows={3}
                                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                ></textarea>
                                <button type="submit" className="mt-2 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors text-sm">
                                    Agregar Seguimiento
                                </button>
                            </form>

                            <div className="space-y-4">
                                {Array.isArray(prospect.followUps) && prospect.followUps.length > 0 ? (
                                    prospect.followUps.map((followUp, index) => {
                                        const followUpDate = new Date(followUp.date);
                                        const isValidDate = !isNaN(followUpDate.getTime());

                                        return (
                                            <div key={index} className="bg-light-gray p-3 rounded-lg">
                                                <p className="text-xs font-semibold text-medium-gray mb-1">
                                                    {isValidDate
                                                        ? format(followUpDate, "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })
                                                        : 'Fecha no válida'}
                                                </p>
                                                <p className="text-sm text-dark-gray">{followUp.comments}</p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">No hay seguimientos registrados.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};