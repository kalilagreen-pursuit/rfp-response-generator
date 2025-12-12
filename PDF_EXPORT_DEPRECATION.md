# PDF Export Deprecation Notice

**Status**: Frontend PDF exporter (`utils/pdfExporter.ts`) is **DEPRECATED**
**Effective Date**: December 5, 2025
**Removal Target**: Version 3.0.0

## Summary

The frontend PDF exporter using jsPDF is deprecated in favor of the backend PDF export service which correctly implements MASTER_PROMPT specifications with Liceria Corporate branding.

## Why This Change?

### Issues with Frontend PDF Exporter

The frontend implementation (`utils/pdfExporter.ts`) has multiple formatting issues:

1. **❌ Wrong Page Format**
   - Uses: A4 (210mm × 297mm)
   - Should be: US Letter (8.5" × 11" / 216mm × 279mm)

2. **❌ Wrong Margins**
   - Uses: 15mm all around (~42.5pt)
   - Should be: Top 1" (72pt), Left/Right 0.75" (54pt), Bottom 0.75" (54pt)

3. **❌ Wrong Font Sizes**
   - Section numbers: Uses 28pt, should be **48pt**
   - Section titles: Uses 28pt, should be **24pt**
   - Title page "Project Proposal": Uses 48pt, should be **32pt**

4. **❌ Hardcoded Dates**
   - "November 2025" is hardcoded in **10+ locations**:
     - Line 533: Title page
     - Line 571: TOC page
     - Line 618: Content pages
     - Line 656: Content pages (page breaks)
     - Line 675: Timeline page
     - Line 707: Timeline page (page breaks)
     - Line 747: Investment page
     - Line 858: Resources page
     - Line 961: Resources page (page breaks)
     - Line 1010: Closing page

5. **❌ Inconsistent Spacing**
   - Doesn't follow MASTER_PROMPT specifications for spacing between elements
   - Section number spacing, title spacing, paragraph spacing all incorrect

6. **❌ Different Typography**
   - Investment Estimate uses styled colored boxes instead of clean template design
   - Various decorative elements not in MASTER_PROMPT spec

### ✅ Backend PDF Exporter is Correct

The backend service (`backend/src/services/export.service.ts`) correctly implements:

- ✅ US Letter format (216mm × 279mm)
- ✅ Correct margins (1" top, 0.75" left/right/bottom)
- ✅ Correct font sizes (48pt section numbers, 24pt titles, 11pt body)
- ✅ Dynamic date generation using `new Date().toLocaleDateString()`
- ✅ Precise spacing per MASTER_PROMPT (8pt after section numbers, 20pt after titles)
- ✅ Liceria Corporate branding colors:
  - Primary: `#4A5859` (Dark Teal)
  - Accent: `#B8A88A` (Gold/Tan)
- ✅ Clean, professional design matching MASTER_PROMPT template

## Migration Guide

### For Application Users

**No action required.** The application automatically uses the backend PDF export when:
- You are logged in (authenticated)
- The proposal has been synced to the backend

The system will automatically fall back to the deprecated frontend exporter only for local-only proposals that haven't been saved to the backend.

### For Developers

#### Before (Deprecated):
```typescript
import { exportProposalToPdf } from './utils/pdfExporter';

await exportProposalToPdf(folder, companyName);
```

#### After (Recommended):
```typescript
import { downloadProposalPdfFromBackend } from './utils/pdfExporter';

await downloadProposalPdfFromBackend(proposalId, proposalTitle);
```

#### Automatic Migration in App.tsx

The `handleDownloadProposalPdf` function now automatically:
1. Checks if user is authenticated
2. Checks if proposal is synced to backend (has valid backend ID)
3. Uses backend export if available
4. Falls back to frontend export only for legacy/local proposals

```typescript
const handleDownloadProposalPdf = useCallback(async (folder: ProjectFolder) => {
    const isAuthenticated = !!getAuthToken();

    if (isAuthenticated && folder.id && folder.id.length > 10) {
        // Use backend PDF export (correct formatting)
        await downloadProposalPdfFromBackend(folder.id, folder.proposal.projectName);
    } else {
        // Fallback to deprecated frontend export
        await exportProposalToPdf(folder, profileData.companyName);
    }
}, []);
```

## API Reference

### Backend PDF Export Endpoint

**Endpoint**: `GET /api/proposals/:id/export/pdf`

**Authentication**: Required (Bearer token)

**Response**:
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="[ProposalTitle].pdf"`

**Implementation**: See [backend/src/controllers/proposal.controller.ts:692](backend/src/controllers/proposal.controller.ts#L692)

**Service**: See [backend/src/services/export.service.ts:476](backend/src/services/export.service.ts#L476)

### Frontend Helper Function

```typescript
/**
 * Download proposal PDF from backend (recommended)
 * Uses the correct MASTER_PROMPT specifications with Liceria Corporate branding.
 *
 * @param proposalId - The proposal ID from the database
 * @param proposalTitle - The proposal title for the filename
 * @returns Promise that resolves when download starts
 */
export const downloadProposalPdfFromBackend = async (
    proposalId: string,
    proposalTitle: string
): Promise<void>
```

**Location**: [utils/pdfExporter.ts:1126](utils/pdfExporter.ts#L1126)

## Timeline

- **December 5, 2025**: Deprecation announced, backend export becomes default
- **Version 2.x**: Both exporters available (automatic selection)
- **Version 3.0.0**: Frontend PDF exporter will be removed entirely

## Related Files

### Deprecated (Will be removed in v3.0.0):
- [utils/pdfExporter.ts](utils/pdfExporter.ts) - Lines 330-1115 (PdfProposalGenerator class)

### Current (Recommended):
- [backend/src/services/export.service.ts](backend/src/services/export.service.ts) - Backend PDF generation service
- [backend/src/controllers/proposal.controller.ts](backend/src/controllers/proposal.controller.ts) - API endpoint controller

### Updated:
- [App.tsx](App.tsx) - Lines 392-416 - Auto-selects correct exporter
- [utils/pdfExporter.ts](utils/pdfExporter.ts) - Lines 3-18 - Deprecation notice

## Testing

To verify you're using the correct backend export:

1. **Check Console Logs**:
   ```
   ✅ "Using backend PDF export for proposal: [id]"
   ❌ "Using deprecated frontend PDF export (proposal not synced to backend)"
   ```

2. **Verify PDF Output**:
   - Check page size: Should be US Letter (8.5" × 11")
   - Check section numbers: Should be 48pt (large and bold)
   - Check header date: Should show current date, not "November 2025"
   - Check colors: Dark Teal (#4A5859) and Gold/Tan (#B8A88A)

## Questions?

For questions about this deprecation:
- See [MASTER_PROMPT.md.pdf](MASTER_PROMPT.md.pdf) for PDF formatting specifications
- Review [backend/src/services/export.service.ts](backend/src/services/export.service.ts) for implementation details
- Check the backend API documentation at `GET /api/proposals/:id/export/pdf`

## Summary of Changes

| Aspect | Frontend (Deprecated) | Backend (Current) |
|--------|----------------------|-------------------|
| Page Format | A4 (210×297mm) ❌ | US Letter (216×279mm) ✅ |
| Margins | 15mm all around ❌ | 1"/0.75" per spec ✅ |
| Section Numbers | 28pt ❌ | 48pt ✅ |
| Section Titles | 28pt ❌ | 24pt ✅ |
| Date | "November 2025" hardcoded ❌ | Dynamic generation ✅ |
| Branding | Correct colors ✅ | Correct colors ✅ |
| Spacing | Inconsistent ❌ | MASTER_PROMPT spec ✅ |
| Typography | Mixed styles ❌ | Clean template ✅ |

---

**Last Updated**: December 5, 2025
**Document Version**: 1.0
