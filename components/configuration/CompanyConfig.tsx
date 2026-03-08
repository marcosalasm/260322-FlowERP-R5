import React, { useState, useEffect } from 'react';
import { CompanyInfo } from '../../types';
import { VAT_RATES } from '../../data/vatRates';

interface CompanyConfigProps {
    companyInfo: CompanyInfo;
    onSave: (info: CompanyInfo) => void;
}

export const CompanyConfig: React.FC<CompanyConfigProps> = ({ companyInfo, onSave }) => {
    const [info, setInfo] = useState<CompanyInfo>(companyInfo);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setInfo(companyInfo);
    }, [companyInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInfo({ ...info, [e.target.name]: e.target.value });
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const countryCode = e.target.value;
        const selectedCountryData = VAT_RATES.find(c => c.code === countryCode);
        setInfo({
            ...info,
            country: countryCode,
            ivaRate: selectedCountryData ? selectedCountryData.rate : 0,
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("El archivo es muy grande. El límite es 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setInfo({ ...info, logoBase64: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setInfo({ ...info, logoBase64: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(info);
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Logo Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-1">
                    <h3 className="text-lg font-medium leading-6 text-dark-gray">Logotipo de la Empresa</h3>
                    <p className="mt-1 text-sm text-slate-500">Este logo aparecerá en reportes y en la barra lateral.</p>
                </div>
                <div className="md:col-span-2">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden border">
                            {info.logoBase64 ? (
                                <img src={info.logoBase64} alt="Previsualización del logo" className="object-contain h-full w-full" />
                            ) : (
                                <span className="text-xs text-slate-400 text-center">Sin logo</span>
                            )}
                        </div>
                        <div>
                            <input type="file" id="logo-upload" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoChange} />
                            <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                Cambiar
                            </label>
                            {info.logoBase64 && (
                                <button type="button" onClick={handleRemoveLogo} className="ml-3 text-sm text-red-600 hover:text-red-800">
                                    Quitar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-200"></div>

            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <h3 className="text-lg font-medium leading-6 text-dark-gray">Información de la Empresa</h3>
                    <p className="mt-1 text-sm text-slate-500">Estos datos se usarán en los documentos generados por el sistema.</p>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                        <input type="text" name="name" id="name" value={info.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="legalId" className="block text-sm font-medium text-slate-700">Cédula Jurídica</label>
                        <input type="text" name="legalId" id="legalId" value={info.legalId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-slate-700">País de Operación</label>
                            <select id="country" name="country" value={info.country} onChange={handleCountryChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                {VAT_RATES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="ivaRate" className="block text-sm font-medium text-slate-700">Tasa Impositiva (IVA)</label>
                            <div className="mt-1 block w-full border border-gray-200 bg-slate-100 rounded-md shadow-sm py-2 px-3 sm:text-sm text-slate-600 font-semibold">
                                {info.ivaRate}%
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700">Dirección Física</label>
                        <input type="text" name="address" id="address" value={info.address} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Teléfono</label>
                            <input type="text" name="phone" id="phone" value={info.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
                            <input type="email" name="email" id="email" value={info.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-slate-200">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400"
                >
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    );
};