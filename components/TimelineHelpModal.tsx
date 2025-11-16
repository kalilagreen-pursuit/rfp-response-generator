import React from 'react';
import { CloseIcon } from './icons';

interface TimelineHelpModalProps {
  onClose: () => void;
}

const TimelineHelpModal: React.FC<TimelineHelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="timeline-help-title">
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 id="timeline-help-title" className="text-xl font-bold text-slate-800">Creating a Professional Project Timeline</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors" aria-label="Close" title="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-slate-700 leading-relaxed">
          <section className="mb-4">
            <h3 className="font-semibold text-lg mb-2 text-slate-800">1. Plan and Define Your Project</h3>
            <p>
              Start by outlining all the key phases and tasks of your project. For each task, define the start date, end date, and who is responsible. It's helpful to organize these tasks logically, grouping them under their respective phases. For example, a project to build a website might have phases like Planning, Design, Development, Testing, and Deployment.
            </p>
          </section>

          <section className="mb-4">
            <h3 className="font-semibold text-lg mb-2 text-slate-800">2. Use a Project Management Tool</h3>
            <p>
              While AI Studio is a great platform for content creation and development, for a project timeline, you would likely use a dedicated project management tool that offers robust features for Gantt charts or timelines. Popular options include <a href="https://airtable.com" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Airtable</a>, <a href="https://asana.com" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Asana</a>, <a href="https://monday.com" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Monday.com</a>, or even a spreadsheet program like Google Sheets or Microsoft Excel. These tools provide templates and functionalities specifically designed for project planning.
            </p>
          </section>
          
          <section className="mb-4">
            <h3 className="font-semibold text-lg mb-2 text-slate-800">3. Create Your Timeline</h3>
            <p className="mb-2">
              In your chosen tool, input the phases, tasks, and dates you defined earlier. Most project management tools will automatically generate a visual timeline or Gantt chart. Here's a quick breakdown:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Airtable:</strong> Use the Gantt or Timeline view to visualize your project.</li>
              <li><strong>Asana/Monday.com:</strong> Use their built-in Timeline or Gantt views.</li>
              <li><strong>Google Sheets/Excel:</strong> While less automated, you can manually create a timeline using conditional formatting and bar charts.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2 text-slate-800">4. Export as a PDF</h3>
            <p>
              Once your timeline is complete and you're happy with the layout, you can export it. Most professional project management tools have a built-in "Export to PDF" function. Look for an option like "Export," "Print," or "Share." If you're using a spreadsheet, you can typically use the "Print" function and select "Save as PDF" as the printer. This will give you a clean, downloadable PDF file of your project timeline that you can easily share.
            </p>
          </section>
          
          <footer className="text-xs text-slate-400 text-right mt-6">
            Licensed by Google
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TimelineHelpModal;