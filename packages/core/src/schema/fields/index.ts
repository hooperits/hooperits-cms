/**
 * HOOPERITS CMS - Field Definitions
 * Export all field helper functions
 */

export { text } from './text';
export { richText } from './richText';
export { portableText } from './portableText';
export { number } from './number';
export { boolean } from './boolean';
export { date, datetime } from './date';
export { image } from './image';
export { file } from './file';
export { slug, generateSlug } from './slug';
export { reference } from './reference';
export { array } from './array';
export { select } from './select';

// Re-export all fields as a single object for convenience
import { text } from './text';
import { richText } from './richText';
import { portableText } from './portableText';
import { number } from './number';
import { boolean } from './boolean';
import { date, datetime } from './date';
import { image } from './image';
import { file } from './file';
import { slug } from './slug';
import { reference } from './reference';
import { array } from './array';
import { select } from './select';

export const fields = {
  text,
  richText,
  portableText,
  number,
  boolean,
  date,
  datetime,
  image,
  file,
  slug,
  reference,
  array,
  select,
};
