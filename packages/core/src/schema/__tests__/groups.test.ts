/**
 * HOOPERITS CMS - Field Groups Tests (Spec 007)
 *
 * Unit tests for field grouping utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  groupFieldsByGroup,
  getFieldGroup,
  getFieldsInGroup,
  groupHasErrors,
  getGroupsWithErrors,
} from '../groups';
import { defineSchema } from '../define';
import { text, number } from '../fields';

describe('Field Grouping', () => {
  describe('groupFieldsByGroup', () => {
    it('should return all fields as ungrouped when no groups defined', () => {
      const schema = defineSchema({
        name: 'simple',
        label: 'Simple',
        fields: {
          title: text({ label: 'Title' }),
          price: number({ label: 'Price' }),
        },
      });

      const result = groupFieldsByGroup(schema);

      expect(result.hasGroups).toBe(false);
      expect(result.groups).toHaveLength(0);
      expect(result.ungroupedFields).toHaveLength(2);
      expect(result.ungroupedFields.map((f) => f.name)).toContain('title');
      expect(result.ungroupedFields.map((f) => f.name)).toContain('price');
    });

    it('should group fields by their group assignment', () => {
      const schema = defineSchema({
        name: 'page',
        label: 'Page',
        groups: [
          { name: 'content', title: 'Content' },
          { name: 'seo', title: 'SEO' },
        ],
        fields: {
          title: text({ label: 'Title', group: 'content' }),
          body: text({ label: 'Body', group: 'content' }),
          metaTitle: text({ label: 'Meta Title', group: 'seo' }),
          metaDescription: text({ label: 'Meta Description', group: 'seo' }),
        },
      });

      const result = groupFieldsByGroup(schema);

      expect(result.hasGroups).toBe(true);
      expect(result.groups).toHaveLength(2);
      expect(result.ungroupedFields).toHaveLength(0);

      // Check content group
      const contentGroup = result.groups.find((g) => g.group.name === 'content');
      expect(contentGroup).toBeDefined();
      expect(contentGroup!.fields.map((f) => f.name)).toEqual(['title', 'body']);

      // Check SEO group
      const seoGroup = result.groups.find((g) => g.group.name === 'seo');
      expect(seoGroup).toBeDefined();
      expect(seoGroup!.fields.map((f) => f.name)).toEqual(['metaTitle', 'metaDescription']);
    });

    it('should handle fields without group assignment', () => {
      const schema = defineSchema({
        name: 'mixed',
        label: 'Mixed',
        groups: [{ name: 'main', title: 'Main' }],
        fields: {
          title: text({ label: 'Title', group: 'main' }),
          subtitle: text({ label: 'Subtitle' }), // No group
          slug: text({ label: 'Slug' }), // No group
        },
      });

      const result = groupFieldsByGroup(schema);

      expect(result.hasGroups).toBe(true);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].fields.map((f) => f.name)).toEqual(['title']);
      expect(result.ungroupedFields).toHaveLength(2);
      expect(result.ungroupedFields.map((f) => f.name)).toContain('subtitle');
      expect(result.ungroupedFields.map((f) => f.name)).toContain('slug');
    });

    it('should maintain group order from schema definition', () => {
      const schema = defineSchema({
        name: 'ordered',
        label: 'Ordered',
        groups: [
          { name: 'third', title: 'Third' },
          { name: 'first', title: 'First' },
          { name: 'second', title: 'Second' },
        ],
        fields: {
          a: text({ label: 'A', group: 'first' }),
          b: text({ label: 'B', group: 'second' }),
          c: text({ label: 'C', group: 'third' }),
        },
      });

      const result = groupFieldsByGroup(schema);

      expect(result.groups.map((g) => g.group.name)).toEqual([
        'third',
        'first',
        'second',
      ]);
    });

    it('should handle empty groups', () => {
      const schema = defineSchema({
        name: 'empty-group',
        label: 'Empty Group',
        groups: [
          { name: 'full', title: 'Full' },
          { name: 'empty', title: 'Empty' },
        ],
        fields: {
          title: text({ label: 'Title', group: 'full' }),
        },
      });

      const result = groupFieldsByGroup(schema);

      expect(result.groups).toHaveLength(2);
      expect(result.groups.find((g) => g.group.name === 'empty')!.fields).toHaveLength(
        0
      );
    });
  });

  describe('getFieldGroup', () => {
    const schema = defineSchema({
      name: 'test',
      label: 'Test',
      groups: [
        { name: 'general', title: 'General' },
        { name: 'advanced', title: 'Advanced', collapsible: true },
      ],
      fields: {
        title: text({ label: 'Title', group: 'general' }),
        settings: text({ label: 'Settings', group: 'advanced' }),
        standalone: text({ label: 'Standalone' }),
      },
    });

    it('should return the group for a grouped field', () => {
      const group = getFieldGroup(schema, 'title');
      expect(group).toBeDefined();
      expect(group!.name).toBe('general');
    });

    it('should return undefined for ungrouped field', () => {
      const group = getFieldGroup(schema, 'standalone');
      expect(group).toBeUndefined();
    });

    it('should return undefined for non-existent field', () => {
      const group = getFieldGroup(schema, 'nonexistent');
      expect(group).toBeUndefined();
    });

    it('should return group with collapsible property', () => {
      const group = getFieldGroup(schema, 'settings');
      expect(group).toBeDefined();
      expect(group!.collapsible).toBe(true);
    });
  });

  describe('getFieldsInGroup', () => {
    const schema = defineSchema({
      name: 'test',
      label: 'Test',
      groups: [{ name: 'content', title: 'Content' }],
      fields: {
        title: text({ label: 'Title', group: 'content' }),
        body: text({ label: 'Body', group: 'content' }),
        other: text({ label: 'Other' }),
      },
    });

    it('should return field names in the group', () => {
      const fields = getFieldsInGroup(schema, 'content');
      expect(fields).toEqual(['title', 'body']);
    });

    it('should return empty array for non-existent group', () => {
      const fields = getFieldsInGroup(schema, 'nonexistent');
      expect(fields).toEqual([]);
    });
  });
});

describe('Group Error Detection', () => {
  const schema = defineSchema({
    name: 'test',
    label: 'Test',
    groups: [
      { name: 'general', title: 'General' },
      { name: 'seo', title: 'SEO' },
    ],
    fields: {
      title: text({ label: 'Title', group: 'general' }),
      body: text({ label: 'Body', group: 'general' }),
      metaTitle: text({ label: 'Meta Title', group: 'seo' }),
    },
  });

  describe('groupHasErrors', () => {
    it('should return true if any field in group has error (Map)', () => {
      const errors = new Map<string, boolean>();
      errors.set('title', true);
      errors.set('body', false);
      errors.set('metaTitle', false);

      expect(groupHasErrors(schema, 'general', errors)).toBe(true);
    });

    it('should return false if no field in group has error (Map)', () => {
      const errors = new Map<string, boolean>();
      errors.set('title', false);
      errors.set('body', false);
      errors.set('metaTitle', true);

      expect(groupHasErrors(schema, 'general', errors)).toBe(false);
    });

    it('should return true if any field in group has error (Record)', () => {
      const errors = { title: true, body: false, metaTitle: false };

      expect(groupHasErrors(schema, 'general', errors)).toBe(true);
    });

    it('should return false if no field in group has error (Record)', () => {
      const errors = { title: false, body: false, metaTitle: true };

      expect(groupHasErrors(schema, 'general', errors)).toBe(false);
    });
  });

  describe('getGroupsWithErrors', () => {
    it('should return groups with errors', () => {
      const errors = {
        title: true,
        body: false,
        metaTitle: true,
      };

      const groupsWithErrors = getGroupsWithErrors(schema, errors);
      expect(groupsWithErrors).toContain('general');
      expect(groupsWithErrors).toContain('seo');
    });

    it('should return only groups with errors', () => {
      const errors = {
        title: true,
        body: false,
        metaTitle: false,
      };

      const groupsWithErrors = getGroupsWithErrors(schema, errors);
      expect(groupsWithErrors).toEqual(['general']);
    });

    it('should return empty array when no errors', () => {
      const errors = {
        title: false,
        body: false,
        metaTitle: false,
      };

      const groupsWithErrors = getGroupsWithErrors(schema, errors);
      expect(groupsWithErrors).toEqual([]);
    });
  });
});
