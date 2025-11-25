import { profileAPI, documentsAPI, rfpAPI, proposalsAPI, getAuthToken } from './api';
import type { ProjectFolder, ProfileData } from '../types';

// Sync service to backup frontend data to backend
// This runs alongside the existing localStorage flow without replacing it

export const syncService = {
  // Check if user is authenticated
  isAuthenticated: () => !!getAuthToken(),

  // Sync profile data to backend
  syncProfile: async (profileData: ProfileData) => {
    if (!getAuthToken()) return;

    try {
      await profileAPI.update({
        company_name: profileData.companyName,
        sms_number: profileData.smsNumber,
        // Teams and documents handled separately
      });
    } catch (error) {
      console.error('Failed to sync profile:', error);
    }
  },

  // Sync a project folder to backend after generation
  syncProject: async (folder: ProjectFolder) => {
    if (!getAuthToken()) return;

    try {
      // First, check if we need to create an RFP entry
      // The backend expects RFP to exist before proposal

      // For now, we'll store the proposal with content
      // This is a simplified sync - full implementation would
      // upload RFP file first, then generate proposal

      const proposalData = {
        title: folder.proposal.projectName,
        content: folder.proposal,
        status: folder.salesStage === 'Closed-Won' ? 'final' :
                folder.salesStage === 'Closed-Lost' ? 'archived' : 'draft',
        // Store additional metadata
        metadata: {
          folderName: folder.folderName,
          rfpFileName: folder.rfpFileName,
          generatedDate: folder.generatedDate,
          templateId: folder.templateId,
          teamId: folder.teamId,
          salesStage: folder.salesStage,
          probability: folder.probability,
          dealValue: folder.dealValue,
          expectedCloseDate: folder.expectedCloseDate,
          scorecard: folder.scorecard,
          slideshow: folder.slideshow,
          videoScript: folder.videoScript,
        }
      };

      // Check if this proposal already exists (by matching metadata)
      const existingProposals = await proposalsAPI.list();
      const existing = existingProposals.proposals?.find(
        (p: any) => p.metadata?.folderName === folder.folderName ||
                    p.title === folder.proposal.projectName
      );

      if (existing) {
        await proposalsAPI.update(existing.id, proposalData);
      } else {
        // For new proposals without backend RFP, we'll need to handle this
        // The current backend expects rfpId, so we may need to adjust
        console.log('New project sync - backend integration pending');
      }
    } catch (error) {
      console.error('Failed to sync project:', error);
    }
  },

  // Load projects from backend (for initial load after login)
  loadProjects: async (): Promise<ProjectFolder[]> => {
    if (!getAuthToken()) return [];

    try {
      const response = await proposalsAPI.list();
      if (!response.proposals) return [];

      // Convert backend proposals to frontend ProjectFolder format
      return response.proposals.map((proposal: any) => {
        const metadata = proposal.metadata || {};
        return {
          id: proposal.id,
          folderName: metadata.folderName || proposal.title,
          rfpFileName: metadata.rfpFileName || 'Unknown',
          rfpContent: '',
          rfpFileDataUrl: '',
          proposal: proposal.content || {},
          generatedDate: metadata.generatedDate || proposal.created_at,
          chatHistory: [],
          templateId: metadata.templateId || 'standard',
          teamId: metadata.teamId || '',
          playbookId: metadata.playbookId || null,
          useGoogleSearch: metadata.useGoogleSearch || false,
          salesStage: metadata.salesStage || 'Prospecting',
          probability: metadata.probability || 10,
          dealValue: metadata.dealValue,
          expectedCloseDate: metadata.expectedCloseDate,
          scorecard: metadata.scorecard,
          slideshow: metadata.slideshow,
          videoScript: metadata.videoScript,
        } as ProjectFolder;
      });
    } catch (error) {
      console.error('Failed to load projects from backend:', error);
      return [];
    }
  },

  // Delete project from backend
  deleteProject: async (id: string) => {
    if (!getAuthToken()) return;

    try {
      await proposalsAPI.delete(id);
    } catch (error) {
      console.error('Failed to delete project from backend:', error);
    }
  },

  // Sync documents (capabilities, resume)
  syncDocument: async (file: File, documentType: string) => {
    if (!getAuthToken()) return;

    try {
      await documentsAPI.upload(file, documentType);
    } catch (error) {
      console.error('Failed to sync document:', error);
    }
  },
};

export default syncService;
