import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';

// ── Types ──────────────────────────────────────────────────────────────────────
interface DocumentNoteDef {
    key: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    defaultNotes: string[];
}

interface DocumentNotesData {
    [documentKey: string]: string[];
}

// ── Document Definitions ───────────────────────────────────────────────────────
const DOCUMENT_DEFINITIONS: DocumentNoteDef[] = [
    {
        key: 'solicitud_cotizacion',
        label: 'Solicitud de Cotización',
        description: 'Notas que se imprimen al pie de las solicitudes de cotización enviadas a proveedores.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
        defaultNotes: [
            'Los precios deben incluir todos los impuestos aplicables.',
            'La cotización tiene una vigencia de 15 días calendario.',
            'Los tiempos de entrega deben ser especificados claramente.',
        ],
    },
    {
        key: 'orden_compra',
        label: 'Orden de Compra',
        description: 'Notas legales y generales que aparecen al pie de las Órdenes de Compra generadas en PDF.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
        ),
        defaultNotes: [
            'Sin firma de un representante legal el presente documento carece de validez.',
            'Se debe indicar en la factura el nombre del proyecto y el consecutivo o número de referencia de la orden de compra.',
            'Los pagos se realizarán los viernes siempre y cuando la respectiva factura haya sido emitida.',
        ],
    },
];

// ── Icons ──────────────────────────────────────────────────────────────────────
const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const ResetIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
);

const GripIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="9" cy="6" r="1.5"/>  <circle cx="15" cy="6" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/> <circle cx="15" cy="12" r="1.5"/>
        <circle cx="9" cy="18" r="1.5"/> <circle cx="15" cy="18" r="1.5"/>
    </svg>
);


// ── Main Component ─────────────────────────────────────────────────────────────
export const DocumentNotesConfig: React.FC = () => {
    const [documentNotes, setDocumentNotes] = useState<DocumentNotesData>({});
    const [selectedDocKey, setSelectedDocKey] = useState<string>(DOCUMENT_DEFINITIONS[0].key);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load saved notes
    useEffect(() => {
        const loadNotes = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.getDocumentNotes();
                if (data && Object.keys(data).length > 0) {
                    setDocumentNotes(data);
                } else {
                    // Initialize with defaults
                    const defaults: DocumentNotesData = {};
                    DOCUMENT_DEFINITIONS.forEach(doc => {
                        defaults[doc.key] = [...doc.defaultNotes];
                    });
                    setDocumentNotes(defaults);
                }
            } catch {
                // Fallback to defaults if API is not ready
                const defaults: DocumentNotesData = {};
                DOCUMENT_DEFINITIONS.forEach(doc => {
                    defaults[doc.key] = [...doc.defaultNotes];
                });
                setDocumentNotes(defaults);
            } finally {
                setIsLoading(false);
            }
        };
        loadNotes();
    }, []);

    const selectedDoc = DOCUMENT_DEFINITIONS.find(d => d.key === selectedDocKey)!;
    const currentNotes = documentNotes[selectedDocKey] ?? selectedDoc.defaultNotes;

    const updateNotes = useCallback((notes: string[]) => {
        setDocumentNotes(prev => ({ ...prev, [selectedDocKey]: notes }));
        setHasChanges(true);
        setSaveSuccess(false);
    }, [selectedDocKey]);

    const handleNoteChange = (index: number, value: string) => {
        const updated = [...currentNotes];
        updated[index] = value;
        updateNotes(updated);
    };

    const handleAddNote = () => {
        updateNotes([...currentNotes, '']);
    };

    const handleRemoveNote = (index: number) => {
        const updated = currentNotes.filter((_, i) => i !== index);
        updateNotes(updated);
    };

    const handleResetToDefaults = () => {
        updateNotes([...selectedDoc.defaultNotes]);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiService.saveDocumentNotes(documentNotes);
            setSaveSuccess(true);
            setHasChanges(false);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving document notes:', error);
            alert('Error al guardar las notas del documento.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-slate-500">Cargando configuración de documentos…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Section Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-1">
                    <h3 className="text-lg font-medium leading-6 text-dark-gray">
                        Documentos del Sistema
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Personalice las notas que aparecen al pie de cada documento generado por la aplicación.
                    </p>
                </div>
                <div className="md:col-span-2">
                    {/* Document Selector */}
                    <label htmlFor="document-select" className="block text-sm font-medium text-slate-700 mb-2">
                        Seleccione un documento
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {DOCUMENT_DEFINITIONS.map(doc => (
                            <button
                                key={doc.key}
                                type="button"
                                onClick={() => { setSelectedDocKey(doc.key); setSaveSuccess(false); }}
                                className={`
                                    relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200
                                    ${selectedDocKey === doc.key
                                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/20'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                    }
                                `}
                            >
                                <div className={`
                                    flex-shrink-0 p-2 rounded-lg transition-colors
                                    ${selectedDocKey === doc.key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}
                                `}>
                                    {doc.icon}
                                </div>
                                <div className="min-w-0">
                                    <span className={`block text-sm font-semibold truncate ${selectedDocKey === doc.key ? 'text-primary' : 'text-slate-700'}`}>
                                        {doc.label}
                                    </span>
                                    <span className="block text-xs text-slate-400 mt-0.5">
                                        {(documentNotes[doc.key] ?? doc.defaultNotes).length} nota(s)
                                    </span>
                                </div>
                                {/* Active indicator */}
                                {selectedDocKey === doc.key && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-200"></div>

            {/* Notes Editor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            {selectedDoc.icon}
                        </div>
                        <h3 className="text-lg font-medium leading-6 text-dark-gray">
                            {selectedDoc.label}
                        </h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                        {selectedDoc.description}
                    </p>
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={handleResetToDefaults}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-orange-300 hover:bg-orange-50 transition-all"
                        >
                            <ResetIcon />
                            Restaurar notas predeterminadas
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                    {currentNotes.map((note, index) => (
                        <div
                            key={index}
                            className="group flex items-start gap-2 bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-sm transition-all"
                        >
                            {/* Grip handle */}
                            <div className="flex-shrink-0 mt-2.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripIcon />
                            </div>

                            {/* Note number badge */}
                            <div className="flex-shrink-0 mt-1">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                    {index + 1}
                                </span>
                            </div>

                            {/* Text area */}
                            <textarea
                                value={note}
                                onChange={(e) => handleNoteChange(index, e.target.value)}
                                rows={2}
                                placeholder={`Escriba la nota #${index + 1}…`}
                                className="
                                    flex-grow block w-full border-0 bg-transparent resize-none
                                    text-sm text-slate-700 placeholder-slate-300
                                    focus:outline-none focus:ring-0
                                "
                            />

                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={() => handleRemoveNote(index)}
                                title="Eliminar nota"
                                className="
                                    flex-shrink-0 mt-1 p-1.5 rounded-md text-slate-400
                                    hover:text-red-600 hover:bg-red-50 transition-colors
                                    opacity-0 group-hover:opacity-100
                                "
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}

                    {/* Add Note Button */}
                    <button
                        type="button"
                        onClick={handleAddNote}
                        className="
                            w-full flex items-center justify-center gap-2 py-3 px-4
                            border-2 border-dashed border-slate-300 rounded-lg
                            text-sm font-medium text-slate-500
                            hover:border-primary hover:text-primary hover:bg-primary/5
                            transition-all duration-200
                        "
                    >
                        <PlusIcon />
                        Agregar nueva nota
                    </button>

                    {currentNotes.length === 0 && (
                        <div className="text-center py-8">
                            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <p className="text-sm text-slate-500">No hay notas configuradas para este documento.</p>
                            <p className="text-xs text-slate-400 mt-1">Agregue notas usando el botón de arriba.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Section */}
            {currentNotes.length > 0 && (
                <>
                    <div className="border-t border-slate-200"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-dark-gray">Vista Previa</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Así se verán las notas en el documento generado.
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 font-mono text-xs space-y-1.5">
                                <p className="font-bold text-slate-700 mb-2 text-sm" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                                    NOTAS GENERALES:
                                </p>
                                {currentNotes.filter(n => n.trim()).map((note, i) => (
                                    <p key={i} className="text-slate-600" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '11px' }}>
                                        • {note}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200">
                {saveSuccess && (
                    <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-fade-in">
                        <CheckIcon />
                        ¡Guardado exitosamente!
                    </div>
                )}
                {hasChanges && !saveSuccess && (
                    <span className="text-sm text-amber-600 font-medium">• Cambios sin guardar</span>
                )}
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className="
                        bg-primary text-white font-bold py-2 px-6 rounded-lg
                        hover:bg-primary-dark transition-colors
                        disabled:bg-slate-400 disabled:cursor-not-allowed
                    "
                >
                    {isSaving ? 'Guardando...' : 'Guardar Notas'}
                </button>
            </div>
        </div>
    );
};
