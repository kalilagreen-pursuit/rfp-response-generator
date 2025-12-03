

import React, { useMemo } from 'react';
import type { ProjectFolder, SalesStage, View } from '../types';
import { formatCurrency } from '../utils/formatters';
import { FolderIcon, UsersIcon, ClipboardCheckIcon, PresentationIcon } from './icons';
import AnalyticsCards from './AnalyticsCards';

interface DashboardViewProps {
    projects: ProjectFolder[];
    onViewChange: (view: View) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.FC<{className?: string}>; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow flex items-center">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const SalesPipelineChart: React.FC<{ projects: ProjectFolder[] }> = ({ projects }) => {
    const stages: SalesStage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed-Won'];

    const pipelineData = useMemo(() => {
        const dataByStage = stages.reduce((acc, stage) => {
            acc[stage] = { count: 0, totalValue: 0 };
            return acc;
        }, {} as Record<SalesStage, { count: number; totalValue: number }>);

        projects.forEach(p => {
            if (stages.includes(p.salesStage)) {
                dataByStage[p.salesStage].count++;
                dataByStage[p.salesStage].totalValue += (p.proposal.investmentEstimate?.high || 0);
            }
        });

        // Simplified to return just the data for each stage.
        return stages.map(stage => {
            const stageData = dataByStage[stage];
            return {
                stage,
                count: stageData.count,
                totalValue: stageData.totalValue,
            };
        });
    }, [projects]);

    const maxValue = Math.max(...pipelineData.map(d => d.totalValue), 1);

    const colors: Record<SalesStage, string> = {
        'Prospecting': 'bg-slate-400',
        'Qualification': 'bg-blue-500',
        'Proposal': 'bg-amber-500',
        'Negotiation': 'bg-purple-500',
        'Closed-Won': 'bg-green-500',
        'Closed-Lost': 'bg-red-500',
    };

    const totalPipelineValue = pipelineData.reduce((sum, stage) => sum + stage.totalValue, 0);

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Sales Pipeline (by Value)</h3>
            <div className="space-y-4">
                {pipelineData.map(({ stage, count, totalValue }) => (
                    <div key={stage} className="grid grid-cols-[112px,1fr,128px] items-center group relative gap-x-4">
                        <span className="text-sm font-medium text-slate-600 text-right">{stage}</span>
                        <div className="flex-grow bg-slate-100 rounded-full h-6">
                            <div
                                className={`h-6 rounded-full ${colors[stage]} flex items-center justify-end px-2 transition-all duration-300`}
                                style={{ width: `${(totalValue / maxValue) * 100}%` }}
                            >
                                <span className="text-xs font-bold text-white">{formatCurrency(totalValue)}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-semibold text-slate-700" title={`Total value for this stage`}>{formatCurrency(totalValue)}</span>
                        </div>
                        <div className="absolute bottom-full left-28 mb-2 w-max p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 pointer-events-none z-10">
                            <p><strong>{count}</strong> {count === 1 ? 'project' : 'projects'} worth <strong>{formatCurrency(totalValue)}</strong> in this stage.</p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-4 pt-4 border-t border-slate-200 text-right">
                <span className="text-sm font-semibold text-slate-800">Total Pipeline Value: {formatCurrency(totalPipelineValue)}</span>
            </div>
        </div>
    );
};

const DashboardView: React.FC<DashboardViewProps> = ({ projects, onViewChange }) => {
    const stats = useMemo(() => {
        const totalProjects = projects.length;
        const totalValue = projects.reduce((sum, p) => sum + (p.proposal.investmentEstimate?.high || 0), 0);
        const winRate = projects.length > 0
            ? (projects.filter(p => p.salesStage === 'Closed-Won').length / projects.filter(p => p.salesStage === 'Closed-Won' || p.salesStage === 'Closed-Lost').length) * 100
            : 0;
        const averageDealSize = totalProjects > 0 ? totalValue / totalProjects : 0;
        return {
            totalProjects: String(totalProjects),
            totalValue: formatCurrency(totalValue),
            winRate: isNaN(winRate) ? '0%' : `${winRate.toFixed(0)}%`,
            averageDealSize: formatCurrency(averageDealSize),
        };
    }, [projects]);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                <p className="text-slate-500">Welcome back! Here's a snapshot of your current projects.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Projects" value={stats.totalProjects} icon={FolderIcon} color="bg-blue-500" />
                <StatCard title="Pipeline Value" value={stats.totalValue} icon={PresentationIcon} color="bg-green-500" />
                <StatCard title="Win Rate" value={stats.winRate} icon={ClipboardCheckIcon} color="bg-amber-500" />
                <StatCard title="Avg. Deal Size" value={stats.averageDealSize} icon={UsersIcon} color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SalesPipelineChart projects={projects} />
                </div>
                <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Ready to Start?</h3>
                    <p className="text-slate-500 mb-4 text-sm">Create a new proposal or manage your existing projects.</p>
                    <button 
                        onClick={() => onViewChange('projects')}
                        className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700"
                    >
                        Go to Projects
                    </button>
                </div>
            </div>

            {/* Analytics Section */}
            <AnalyticsCards className="mb-6" />
        </div>
    );
};

export default DashboardView;