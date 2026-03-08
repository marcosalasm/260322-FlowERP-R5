import React, { useState, useMemo, useContext } from 'react';
import { Card } from '../shared/Card';
import { AppContext } from '../../context/AppContext';
import { ProjectsTable } from './ProjectsTable';
import { Project } from '../../types';
import { ProjectDetailModal } from './ProjectDetailModal';

const ProjectsDashboard: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;

    const { projects, setProjects, changeOrders, accountsReceivable, purchaseOrders, accountsPayable, budgets, offers, subcontracts } = appContext;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const filteredProjects = useMemo(() => {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        if (!trimmedSearch) {
            return projects;
        }
        return projects.filter(project =>
            project.name.toLowerCase().includes(trimmedSearch) ||
            project.owner.toLowerCase().includes(trimmedSearch) ||
            String(project.id).includes(trimmedSearch)
        );
    }, [projects, searchTerm]);
    
    const handleViewDetails = (project: Project) => {
        setSelectedProject(project);
        setIsDetailModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailModalOpen(false);
        setSelectedProject(null);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-3xl font-bold text-dark-gray">Módulo de Proyectos</h2>
                </div>

                <Card title="Gestión de Proyectos">
                    <div className="mb-4">
                         <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar por nombre de proyecto, cliente o ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full max-w-md p-2 pl-10 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label="Buscar proyectos"
                            />
                        </div>
                    </div>
                    <ProjectsTable 
                        projects={filteredProjects} 
                        onViewDetails={handleViewDetails}
                        accountsReceivable={accountsReceivable}
                    />
                </Card>
            </div>
            {selectedProject && (
                 <ProjectDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseModal}
                    project={selectedProject}
                    setProjects={setProjects}
                    changeOrders={changeOrders}
                    accountsReceivable={accountsReceivable}
                    purchaseOrders={purchaseOrders}
                    accountsPayable={accountsPayable}
                    budgets={budgets}
                    offers={offers}
                    subcontracts={subcontracts}
                />
            )}
        </>
    );
};

export default ProjectsDashboard;