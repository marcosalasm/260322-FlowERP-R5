import { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Action, Permissions } from '../types';

// Function to merge multiple permission sets (union)
const mergePermissions = (...permissionSets: (Permissions | undefined)[]): Permissions => {
    const merged: Permissions = {};
    for (const pSet of permissionSets) {
        if (!pSet) continue;
        for (const module in pSet) {
            if (!merged[module]) merged[module] = {};
            for (const section in pSet[module]) {
                if (!merged[module][section]) merged[module][section] = [];
                const actions = pSet[module][section];
                merged[module][section] = [...new Set([...merged[module][section], ...actions])];
            }
        }
    }
    return merged;
};

export const usePermissions = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('usePermissions must be used within an AppContextProvider');
    }

    const { user, roles } = context;

    const userPermissions = useMemo(() => {
        if (!user || !roles) {
            return {};
        }
        const userRoles = roles.filter(role => user.roleIds.includes(role.id));
        const rolePermissions = userRoles.map(role => role.permissions);
        
        // Merge permissions from all roles, then merge user's individual overrides on top
        return mergePermissions(...rolePermissions, user.individualPermissions);
    }, [user, roles]);

    const can = (module: string, section: string, action: Action): boolean => {
        if (!userPermissions) return false;
        // Super-admin check for default 'Gerente General' role
        const generalManagerRole = roles.find(r => r.name === 'Gerente General' && r.isDefault);
        if (generalManagerRole && user.roleIds.includes(generalManagerRole.id)) {
            return true;
        }
        return !!userPermissions[module]?.[section]?.includes(action);
    };

    return { can, userPermissions };
};
