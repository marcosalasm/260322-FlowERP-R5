import React from 'react';
import { Permissions, Action } from '../../types';
import { PERMISSIONS_STRUCTURE } from '../../constants';

interface PermissionTreeProps {
    permissions: Permissions;
    setPermissions: React.Dispatch<React.SetStateAction<Permissions>>;
    isDisabled?: boolean;
}

export const PermissionTree: React.FC<PermissionTreeProps> = ({ permissions, setPermissions, isDisabled = false }) => {

    const handleActionChange = (module: string, section: string, action: Action, checked: boolean) => {
        setPermissions(prev => {
            const newPerms = JSON.parse(JSON.stringify(prev)); // Deep copy
            if (!newPerms[module]) newPerms[module] = {};
            if (!newPerms[module][section]) newPerms[module][section] = [];

            if (checked) {
                newPerms[module][section] = [...new Set([...newPerms[module][section], action])];
            } else {
                newPerms[module][section] = newPerms[module][section].filter((a: Action) => a !== action);
            }
            return newPerms;
        });
    };

    const handleSectionChange = (module: string, section: string, checked: boolean) => {
        const allActions = PERMISSIONS_STRUCTURE[module as keyof typeof PERMISSIONS_STRUCTURE].sections[section as keyof typeof PERMISSIONS_STRUCTURE[keyof typeof PERMISSIONS_STRUCTURE]['sections']].actions;
        setPermissions(prev => {
            const newPerms = JSON.parse(JSON.stringify(prev));
            if (!newPerms[module]) newPerms[module] = {};
            
            if (checked) {
                newPerms[module][section] = allActions;
            } else {
                delete newPerms[module][section];
            }
            return newPerms;
        });
    };

    const handleModuleChange = (module: string, checked: boolean) => {
         setPermissions(prev => {
            const newPerms = JSON.parse(JSON.stringify(prev));
            if (checked) {
                newPerms[module] = {};
                const moduleSections = PERMISSIONS_STRUCTURE[module as keyof typeof PERMISSIONS_STRUCTURE].sections;
                for (const sectionKey in moduleSections) {
                    newPerms[module][sectionKey] = moduleSections[sectionKey as keyof typeof moduleSections].actions;
                }
            } else {
                delete newPerms[module];
            }
            return newPerms;
        });
    };
    
    return (
        <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
            {Object.entries(PERMISSIONS_STRUCTURE).map(([moduleKey, moduleData]) => {
                const isModuleChecked = permissions[moduleKey] && Object.keys(permissions[moduleKey]).length === Object.keys(moduleData.sections).length &&
                    Object.entries(moduleData.sections).every(([sectionKey, sectionData]) => 
                        permissions[moduleKey][sectionKey]?.length === sectionData.actions.length
                    );

                return (
                    <details key={moduleKey} className="bg-white p-3 rounded-md shadow-sm" open>
                        <summary className="font-semibold text-lg text-primary cursor-pointer flex items-center">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                                checked={isModuleChecked}
                                onChange={e => handleModuleChange(moduleKey, e.target.checked)}
                                disabled={isDisabled}
                            />
                            {moduleData.label}
                        </summary>
                        <div className="pl-8 pt-4 space-y-3">
                            {Object.entries(moduleData.sections).map(([sectionKey, sectionData]) => {
                                const isSectionChecked = permissions[moduleKey]?.[sectionKey]?.length === sectionData.actions.length;

                                return(
                                    <div key={sectionKey} className="border-l-2 pl-4">
                                        <div className="font-medium text-dark-gray flex items-center mb-2">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                                                checked={isSectionChecked}
                                                onChange={e => handleSectionChange(moduleKey, sectionKey, e.target.checked)}
                                                disabled={isDisabled}
                                            />
                                            {sectionData.label}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pl-7">
                                            {sectionData.actions.map(action => (
                                                <label key={action} className="flex items-center text-sm text-slate-600">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                                                        checked={permissions[moduleKey]?.[sectionKey]?.includes(action) || false}
                                                        onChange={e => handleActionChange(moduleKey, sectionKey, action, e.target.checked)}
                                                        disabled={isDisabled}
                                                    />
                                                    {action.charAt(0).toUpperCase() + action.slice(1)}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            )}
                        </div>
                    </details>
                )}
            )}
        </div>
    );
};
