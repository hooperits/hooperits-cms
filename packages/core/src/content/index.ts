/**
 * HOOPERITS CMS - Content Module
 * Public API for content management
 */

// Service
export type {
  ContentInput,
  Content,
  ListContentOptions,
  ListContentResult,
} from './service';

export {
  listContent,
  getContentById,
  getContentBySlug,
  createContent,
  updateContent,
  deleteContent,
  publishContent,
  unpublishContent,
} from './service';

// Validation
export type {
  ContentInputValidation,
  ContentUpdateValidation,
  ContentListQueryValidation,
} from './validation';

export {
  contentInputSchema,
  contentUpdateSchema,
  contentListQuerySchema,
  validateContentInput,
  validateContentUpdate,
  validateContentListQuery,
} from './validation';
