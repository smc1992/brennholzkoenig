
import { supabase } from './supabase';

interface PageContent {
  id: string;
  page_slug: string;
  content_key: string;
  content_value: string;
  content_type: 'text' | 'html' | 'json';
  created_at?: string;
  updated_at?: string;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
  } | null;
}

export class ContentManager {
  async getPageContent(pageSlug: string): Promise<PageContent[]> {
    try {
      const { data, error }: SupabaseResponse<PageContent[]> = await supabase
        .from('page_contents')
        .select('*')
        .eq('page_slug', pageSlug);

      if (error) {
        console.error('Error fetching page content:', error.message);
        return [];
      }

      return data || [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in getPageContent:', errorMessage);
      return [];
    }
  }

  async updatePageContent(pageSlug: string, contentKey: string, contentValue: string, contentType: PageContent['content_type'] = 'text'): Promise<boolean> {
    try {
      const { data, error }: SupabaseResponse<PageContent> = await supabase
        .from('page_contents')
        .upsert({
          page_slug: pageSlug,
          content_key: contentKey,
          content_value: contentValue,
          content_type: contentType,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating page content:', error.message);
        return false;
      }

      return data !== null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in updatePageContent:', errorMessage);
      return false;
    }
  }

  async createPageContent(pageSlug: string, contentKey: string, contentValue: string, contentType: PageContent['content_type'] = 'text'): Promise<PageContent | null> {
    try {
      const { data, error }: SupabaseResponse<PageContent> = await supabase
        .from('page_contents')
        .insert({
          page_slug: pageSlug,
          content_key: contentKey,
          content_value: contentValue,
          content_type: contentType
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating page content:', error.message);
        return null;
      }

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in createPageContent:', errorMessage);
      return null;
    }
  }

  async deletePageContent(pageSlug: string, contentKey: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('page_contents')
        .delete()
        .eq('page_slug', pageSlug)
        .eq('content_key', contentKey);

      if (error) {
        console.error('Error deleting page content:', error.message);
        return false;
      }

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in deletePageContent:', errorMessage);
      return false;
    }
  }

  async getAllPageSlugs(): Promise<string[]> {
    try {
      const { data, error }: SupabaseResponse<Array<{ page_slug: string }>> = await supabase
        .from('page_contents')
        .select('page_slug')
        .not('page_slug', 'is', null);

      if (error) {
        console.error('Error fetching page slugs:', error.message);
        return [];
      }

      if (!data) return [];

      const uniqueSlugs = [...new Set(data.map((item: { page_slug: string }) => item.page_slug))];
      return uniqueSlugs;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in getAllPageSlugs:', errorMessage);
      return [];
    }
  }
}

export const contentManager = new ContentManager();
