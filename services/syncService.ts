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
  // Returns the synced proposal ID (either existing or newly created)
  syncProject: async (folder: ProjectFolder): Promise<string | null> => {
    if (!getAuthToken()) return null;

    try {
      // Store metadata inside the content object
      const contentWithMetadata = {
        ...folder.proposal,
        _metadata: {
          folderName: folder.folderName,
          rfpFileName: folder.rfpFileName,
          generatedDate: folder.generatedDate,
          templateId: folder.templateId,
          teamId: folder.teamId,
          salesStage: folder.salesStage,
          probability: folder.probability,
          scorecard: folder.scorecard,
          slideshow: folder.slideshow,
          videoScript: folder.videoScript,
        }
      };

      const proposalData = {
        title: folder.proposal.projectName,
        content: contentWithMetadata,
        status: folder.salesStage === 'Closed-Won' ? 'final' :
                folder.salesStage === 'Closed-Lost' ? 'archived' : 'draft',
        template: folder.templateId || 'standard',
      };

      // Check if this proposal already exists by ID (if it's a UUID) or by matching metadata
      let existing = null;
      
      // First, try to get by ID if it looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(folder.id)) {
        try {
          const response = await proposalsAPI.get(folder.id);
          if (response.proposal && !response.error) {
            existing = { id: response.proposal.id };
          }
        } catch (err) {
          // Proposal doesn't exist by ID, continue to search by metadata
        }
      }

      // If not found by ID, search by metadata
      if (!existing) {
        const existingProposals = await proposalsAPI.list();
        existing = existingProposals.proposals?.find(
          (p: any) => p.content?._metadata?.folderName === folder.folderName ||
                      p.title === folder.proposal.projectName
        );
      }

      if (existing) {
        // Update existing proposal
        console.log(`[Sync] Updating existing proposal: ${existing.id}`);
        await proposalsAPI.update(existing.id, proposalData);
        return existing.id;
      } else {
        // Create new proposal
        console.log(`[Sync] Creating new proposal: ${folder.proposal.projectName}`);
        const response = await proposalsAPI.create(proposalData);
        if (response.proposal?.id) {
          console.log(`[Sync] Proposal created with ID: ${response.proposal.id}`);
          return response.proposal.id;
        }
        console.warn('[Sync] Proposal creation response missing ID');
        return null;
      }
    } catch (error) {
      console.error('[Sync] Failed to sync project:', error);
      if (error instanceof Error) {
        console.error('[Sync] Error details:', error.message, error.stack);
      }
      return null;
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
        const content = proposal.content || {};
        const metadata = content._metadata || {};
        // Remove metadata from proposal content
        const { _metadata, ...proposalContent } = content;
        
        return {
          id: proposal.id,
          folderName: metadata.folderName || proposal.title,
          rfpFileName: metadata.rfpFileName || 'Unknown',
          rfpContent: '',
          rfpFileDataUrl: '',
          proposal: proposalContent,
          generatedDate: metadata.generatedDate || proposal.created_at,
          chatHistory: [],
          templateId: metadata.templateId || 'standard',
          teamId: metadata.teamId || '',
          playbookId: metadata.playbookId || null,
          useGoogleSearch: metadata.useGoogleSearch || false,
          salesStage: metadata.salesStage || 'Prospecting',
          probability: metadata.probability || 10,
          nextStepDate: null,
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
