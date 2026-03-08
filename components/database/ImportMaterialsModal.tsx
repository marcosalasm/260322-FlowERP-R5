import React, { useState, useCallback, useContext } from 'react';
import Papa from 'papaparse';
import { AppContext } from '../../context/AppContext';
import { Material } from '../../types';

interface ImportMaterialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newMaterials: Omit<Material, 'id' | 'lastUpdated' | 'quantity'>[]) => void;
}

type ParsedRow = { name: string; unit: string; unitCost: string };
type ValidatedRow = { data: Omit<Material, 'id' | 'lastUpdated' | 'quantity'>; originalRow: number };
type ErrorRow = { data: ParsedRow; originalRow: number; error: string };

export const ImportMaterialsModal: React.FC<ImportMaterialsModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const appContext = useContext(AppContext);
    const { materials } = appContext || { materials: [] };

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ValidatedRow[]>([]);
    const [errors, setErrors] = useState<ErrorRow[]>([]);
    const [isValidating, setIsValidating] = useState(false);

    const resetState = () => {
        setFile(null);
        setParsedData([]);
        setErrors([]);
        setIsValidating(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        resetState();
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            validateData(selectedFile);
        }
    };

    const validateData = useCallback((fileToValidate: File) => {
        setIsValidating(true);
        const existingMaterialNames = new Set(materials.map(m => m.name.trim().toLowerCase()));

        Papa.parse(fileToValidate, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const validRows: ValidatedRow[] = [];
                const errorRows: ErrorRow[] = [];

                results.data.forEach((row: any, index) => {
                    const typedRow = row as ParsedRow;
                    const materialName = typedRow.name?.trim();
                    const materialUnit = typedRow.unit?.trim();
                    const materialCost = typedRow.unitCost;

                    if (!materialName || !materialUnit || materialCost === undefined || materialCost === null) {
                        errorRows.push({ data: typedRow, originalRow: index + 2, error: 'Faltan datos obligatorios (nombre, unidad o costo).' });
                    } else if (isNaN(Number(materialCost))) {
                        errorRows.push({ data: typedRow, originalRow: index + 2, error: 'El costo unitario debe ser un número válido.' });
                    } else if (existingMaterialNames.has(materialName.toLowerCase())) {
                        errorRows.push({ data: typedRow, originalRow: index + 2, error: `El material "${materialName}" ya existe.` });
                    } else {
                        validRows.push({
                            data: { name: materialName, unit: materialUnit, unitCost: Number(materialCost) },
                            originalRow: index + 2
                        });
                        existingMaterialNames.add(materialName.toLowerCase()); // Add to set to catch duplicates within the same file
                    }
                });

                setParsedData(validRows);
                setErrors(errorRows);
                setIsValidating(false);
            },
            error: (error) => {
                console.error("CSV Parsing Error:", error);
                setErrors([{ data: {} as ParsedRow, originalRow: 0, error: `Error al leer el archivo: ${error.message}` }]);
                setIsValidating(false);
            }
        });
    }, [materials]);

    const handleImport = () => {
        const newMaterials = parsedData.map(row => row.data);
        onSubmit(newMaterials);
        resetState();
    };

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8," + "name,unit,unitCost\nMaterial de Ejemplo,Saco 25kg,2500.50";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_materiales.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-dark-gray">Importar Materiales desde Excel/CSV</h2>
                        <p className="text-sm text-slate-500">Suba un archivo CSV con las columnas: name, unit, unitCost.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>

                <div className="flex-shrink-0 flex items-center gap-4 mb-4">
                    <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="csv-upload" className="cursor-pointer bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-dark">
                        {file ? 'Cambiar Archivo' : 'Seleccionar Archivo CSV'}
                    </label>
                    <button onClick={handleDownloadTemplate} className="text-sm text-primary hover:underline">Descargar Plantilla</button>
                    {file && <span className="text-sm text-slate-600 truncate">{file.name}</span>}
                </div>

                <div className="flex-grow overflow-y-auto border-t pt-4 space-y-4">
                    {isValidating && <p className="text-center text-slate-500">Validando datos...</p>}
                    {!isValidating && (parsedData.length > 0 || errors.length > 0) && (
                        <>
                            <div className="bg-green-50 p-3 rounded-lg">
                                <h3 className="font-semibold text-green-800">Materiales Válidos a Importar ({parsedData.length})</h3>
                                <div className="max-h-48 overflow-y-auto mt-2 text-sm">
                                    <ul className="list-disc list-inside">
                                        {parsedData.map(row => (
                                            <li key={row.originalRow}>{row.data.name} - {row.data.unit} - ¢{row.data.unitCost?.toLocaleString()}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg">
                                <h3 className="font-semibold text-red-800">Registros con Errores ({errors.length})</h3>
                                {errors.length > 0 ? (
                                    <div className="max-h-48 overflow-y-auto mt-2 text-sm">
                                        <ul className="list-disc list-inside">
                                            {errors.map(err => (
                                                <li key={err.originalRow}>Fila {err.originalRow}: {err.error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : <p className="text-sm text-red-700 italic mt-1">No se encontraron errores.</p>}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex-shrink-0 pt-4 mt-4 border-t flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button onClick={handleImport} disabled={parsedData.length === 0 || isValidating} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark disabled:bg-slate-400">
                        Importar {parsedData.length} Materiales
                    </button>
                </div>
            </div>
        </div>
    );
};