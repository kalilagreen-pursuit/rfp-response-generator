
import React, { useState } from 'react';
import type { IndustryPlaybook, GlossaryItem, ComplianceProfile, CustomSection, LearnedPreference } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { PlusIcon, DeleteIcon, EditIcon, SaveIcon, ChevronDownIcon, BookOpenIcon, CloseIcon } from './icons';
import { playbookTemplates } from '../utils/playbookTemplates';

interface PlaybookSectionProps {
    title: string;
    children: React.ReactNode;
}

const PlaybookSection: React.FC<PlaybookSectionProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="border border-slate-200 rounded-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                aria-expanded={isOpen}
            >
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 space-y-4">{children}</div>}
        </div>
    );
};

const formatTemplateKey = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

const IndustryPlaybookEditor: React.FC = () => {
    const { industryPlaybooks, addIndustryPlaybook, updateIndustryPlaybook, deleteIndustryPlaybook, addToast, deleteLearnedPreferenceFromPlaybook } = useAppContext();
    const [newPlaybookName, setNewPlaybookName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('blank');
    const [selectedPlaybook, setSelectedPlaybook] = useState<IndustryPlaybook | null>(null);

    // --- State for editing within a playbook ---
    const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
    const [kpis, setKpis] = useState<string[]>([]);
    const [compliance, setCompliance] = useState<ComplianceProfile[]>([]);
    const [customSections, setCustomSections] = useState<CustomSection[]>([]);
    const [learnedPreferences, setLearnedPreferences] = useState<LearnedPreference[]>([]);

    
    const [newGlossaryTerm, setNewGlossaryTerm] = useState('');
    const [newGlossaryDef, setNewGlossaryDef] = useState('');
    const [newKpi, setNewKpi] = useState('');
    const [newComplianceName, setNewComplianceName] = useState('');
    const [newComplianceDesc, setNewComplianceDesc] = useState('');
    const [newSectionName, setNewSectionName] = useState('');
    const [newSectionPrompt, setNewSectionPrompt] = useState('');
    
    React.useEffect(() => {
        if (selectedPlaybook) {
            const currentPlaybook = industryPlaybooks.find(p => p.id === selectedPlaybook.id);
            if (currentPlaybook) {
                setGlossary(currentPlaybook.glossary);
                setKpis(currentPlaybook.kpis);
                setCompliance(currentPlaybook.complianceProfiles);
                setCustomSections(currentPlaybook.customSections);
                setLearnedPreferences(currentPlaybook.learnedPreferences || []);
            }
        } else {
            // Clear fields when no playbook is selected
            setGlossary([]);
            setKpis([]);
            setCompliance([]);
            setCustomSections([]);
            setLearnedPreferences([]);
        }
    }, [selectedPlaybook, industryPlaybooks]);

    const handleCreatePlaybook = () => {
        if (!newPlaybookName.trim()) {
            addToast('Playbook name cannot be empty.');
            return;
        }
        if (industryPlaybooks.some(p => p.name.toLowerCase() === newPlaybookName.trim().toLowerCase())) {
            addToast('A playbook with this name already exists.');
            return;
        }
        addIndustryPlaybook(newPlaybookName.trim(), selectedTemplate === 'blank' ? undefined : selectedTemplate);
        setNewPlaybookName('');
        setSelectedTemplate('blank');
    };

    const handleSave = () => {
        if (!selectedPlaybook) return;
        updateIndustryPlaybook({
            ...selectedPlaybook,
            glossary,
            kpis,
            complianceProfiles: compliance,
            customSections,
            learnedPreferences,
        });
        addToast('Playbook saved successfully.', 'success');
    };
    
    const handleDeletePreference = (prefId: string) => {
        if (!selectedPlaybook) return;
        deleteLearnedPreferenceFromPlaybook(selectedPlaybook.id, prefId);
    };

    const addListItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, newItem: T) => setter(prev => [...prev, newItem]);
    const deleteListItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string) => setter(prev => prev.filter((item: any) => item.id !== id));
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Industry Playbooks</h2>
                <div className="space-y-2 mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <h3 className="font-semibold text-slate-700">Create New Playbook</h3>
                     <input
                        type="text"
                        value={newPlaybookName}
                        onChange={(e) => setNewPlaybookName(e.target.value)}
                        placeholder="New playbook name..."
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                     <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="blank">-- Start with a Blank Playbook --</option>
                        {Object.keys(playbookTemplates).map(key => (
                            <option key={key} value={key}>{formatTemplateKey(key)}</option>
                        ))}
                    </select>
                    <button onClick={handleCreatePlaybook} title="Add New Playbook" className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">
                        <PlusIcon className="h-5 w-5" /> Add Playbook
                    </button>
                </div>
                <div className="space-y-2">
                    {industryPlaybooks.map(p => (
                        <div
                            key={p.id}
                            className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${selectedPlaybook?.id === p.id ? 'bg-red-100' : 'hover:bg-slate-100'}`}
                            onClick={() => setSelectedPlaybook(p)}
                        >
                            <span className={`font-semibold ${selectedPlaybook?.id === p.id ? 'text-red-800' : 'text-slate-700'}`}>{p.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); deleteIndustryPlaybook(p.id); setSelectedPlaybook(null); }} className="p-1 text-slate-400 hover:text-red-600">
                                <DeleteIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                {selectedPlaybook ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">Editing: {selectedPlaybook.name}</h2>
                            <button onClick={handleSave} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700">
                                <SaveIcon className="w-5 h-5" /> Save Changes
                            </button>
                        </div>

                        <PlaybookSection title="Learned Preferences">
                            {learnedPreferences.length > 0 ? (
                                learnedPreferences.map(pref => (
                                    <div key={pref.id} className="bg-slate-50 p-3 rounded-md border group">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-semibold text-slate-700">
                                                Section: <span className="font-mono bg-slate-200 px-1 py-0.5 rounded">{pref.sectionKey}</span>
                                            </p>
                                            <button onClick={() => handleDeletePreference(pref.id)} className="p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><DeleteIcon className="w-4 h-4" /></button>
                                        </div>
                                        <blockquote className="mt-2 text-sm text-slate-600 border-l-2 border-slate-300 pl-3 italic whitespace-pre-wrap">
                                            "{pref.preference}"
                                        </blockquote>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 text-center">No preferences learned yet. Edit a proposal in the Co-pilot to teach the AI.</p>
                            )}
                        </PlaybookSection>

                        <PlaybookSection title="Industry Glossary">
                            <div className="flex gap-2">
                                <input value={newGlossaryTerm} onChange={e => setNewGlossaryTerm(e.target.value)} placeholder="Term" className="w-1/3 px-3 py-2 border rounded-md text-sm" />
                                <input value={newGlossaryDef} onChange={e => setNewGlossaryDef(e.target.value)} placeholder="Definition" className="flex-grow px-3 py-2 border rounded-md text-sm" />
                                <button onClick={() => {addListItem(setGlossary, {id: crypto.randomUUID(), term: newGlossaryTerm, definition: newGlossaryDef }); setNewGlossaryTerm(''); setNewGlossaryDef('');}} className="p-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                            {glossary.map(item => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                    <strong className="w-1/3">{item.term}:</strong>
                                    <p className="flex-grow">{item.definition}</p>
                                    <button onClick={() => deleteListItem(setGlossary, item.id)} className="p-1 text-slate-400 hover:text-red-600"><DeleteIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </PlaybookSection>

                        <PlaybookSection title="Key Performance Indicators (KPIs)">
                            <div className="flex gap-2">
                                <input value={newKpi} onChange={e => setNewKpi(e.target.value)} placeholder="KPI (e.g., Increased patient satisfaction)" className="flex-grow px-3 py-2 border rounded-md text-sm" />
                                <button onClick={() => {setKpis(prev => [...prev, newKpi]); setNewKpi('');}} className="p-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                            <ul className="list-disc list-inside space-y-1">
                                {kpis.map((kpi, i) => (
                                    <li key={i} className="flex justify-between items-center group">
                                        <span>{kpi}</span>
                                        <button onClick={() => setKpis(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                                            <DeleteIcon className="w-4 h-4"/>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </PlaybookSection>
                        
                         <PlaybookSection title="Compliance & Risk Profiles">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <input value={newComplianceName} onChange={e => setNewComplianceName(e.target.value)} placeholder="Profile Name (e.g., GDPR Compliance)" className="md:col-span-2 px-3 py-2 border rounded-md text-sm" />
                                <textarea value={newComplianceDesc} onChange={e => setNewComplianceDesc(e.target.value)} placeholder="Description..." className="md:col-span-2 px-3 py-2 border rounded-md text-sm" rows={2}/>
                                <button onClick={() => { addListItem(setCompliance, { id: crypto.randomUUID(), name: newComplianceName, description: newComplianceDesc }); setNewComplianceName(''); setNewComplianceDesc(''); }} className="md:col-span-2 p-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 flex items-center justify-center gap-2">
                                    <PlusIcon className="w-5 h-5"/> Add Profile
                                </button>
                            </div>
                            {compliance.map(item => (
                                <div key={item.id} className="flex flex-col gap-1 text-sm bg-slate-50 p-2 rounded-md border">
                                    <div className="flex justify-between items-center">
                                        <strong>{item.name}</strong>
                                        <button onClick={() => deleteListItem(setCompliance, item.id)} className="p-1 text-slate-400 hover:text-red-600"><DeleteIcon className="w-4 h-4"/></button>
                                    </div>
                                    <p className="text-xs text-slate-500 italic">"{item.description}"</p>
                                </div>
                            ))}
                        </PlaybookSection>

                        <PlaybookSection title="Custom Proposal Sections (Smart Templates)">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <input value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="Section Name (e.g., Data Security Plan)" className="px-3 py-2 border rounded-md text-sm" />
                                <input value={newSectionPrompt} onChange={e => setNewSectionPrompt(e.target.value)} placeholder="AI Prompt for this section" className="md:col-span-2 px-3 py-2 border rounded-md text-sm" />
                                <button onClick={() => { addListItem(setCustomSections, { id: crypto.randomUUID(), sectionName: newSectionName, sectionPrompt: newSectionPrompt }); setNewSectionName(''); setNewSectionPrompt(''); }} className="md:col-span-2 p-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 flex items-center justify-center gap-2">
                                    <PlusIcon className="w-5 h-5"/> Add Section
                                </button>
                            </div>
                            {customSections.map(item => (
                                <div key={item.id} className="flex flex-col gap-1 text-sm bg-slate-50 p-2 rounded-md border">
                                    <div className="flex justify-between items-center">
                                        <strong className="">{item.sectionName}</strong>
                                        <button onClick={() => deleteListItem(setCustomSections, item.id)} className="p-1 text-slate-400 hover:text-red-600"><DeleteIcon className="w-4 h-4"/></button>
                                    </div>
                                    <p className="text-xs text-slate-500 italic">Prompt: "{item.sectionPrompt}"</p>
                                </div>
                            ))}
                        </PlaybookSection>

                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                        <BookOpenIcon className="w-24 h-24 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">No Playbook Selected</h3>
                        <p>Select a playbook from the left panel to edit its contents, or create a new one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IndustryPlaybookEditor;
