/**
 * Supabase Service
 * Client Supabase configuré pour l'application
 * Utilise SERVICE_KEY pour bypass RLS (backend trusted)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types pour les tables Supabase
export interface ContentGeneration {
  id: string;
  content_type: string;
  template_id?: string;
  variations: {
    text: string;
    style: string;
    score: number;
    hashtags: string[];
  }[];
  selected_variation?: number;
  custom_edits?: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'published' | 'failed';
  workflow_id?: string;
  created_at: string;
  approved_at?: string;
  published_at?: string;
}

export interface GeneratedImage {
  id: string;
  generation_id: string;
  supabase_path: string;
  public_url: string;
  dalle_prompt: string;
  size: string;
  created_at: string;
}

export interface FacebookPost {
  id: string;
  post_id?: string;
  generation_id: string;
  content: string;
  image_url?: string;
  status: 'pending' | 'scheduled' | 'published' | 'failed';
  published_at?: string;
  scheduled_for?: string;
  error_message?: string;
  created_at: string;
}

export interface PostAnalytics {
  id: string;
  post_id: string;
  facebook_post_id: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagement_rate?: number;
  collected_at: string;
  created_at: string;
}

export interface ApprovalQueue {
  id: string;
  generation_id: string;
  workflow_id: string;
  variations: any[];
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

/**
 * Classe Service Supabase
 * Singleton pattern pour réutiliser la même instance
 */
class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient;

  private constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis dans .env'
      );
    }

    // Utiliser SERVICE_KEY pour bypass RLS (backend est trusted)
    this.client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log('[Supabase] Client initialisé avec succès');
  }

  /**
   * Récupérer l'instance singleton
   */
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Récupérer le client Supabase
   */
  public getClient(): SupabaseClient {
    return this.client;
  }

  // ==========================================
  // CONTENT GENERATIONS
  // ==========================================

  async createContentGeneration(data: {
    content_type: string;
    template_id?: string;
    variations: any[];
    workflow_id?: string;
  }): Promise<ContentGeneration> {
    const { data: generation, error } = await this.client
      .from('content_generations')
      .insert({
        content_type: data.content_type,
        template_id: data.template_id,
        variations: data.variations,
        workflow_id: data.workflow_id,
        status: 'pending_approval',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création content_generation: ${error.message}`);
    }

    return generation;
  }

  async updateContentGeneration(
    id: string,
    updates: Partial<ContentGeneration>
  ): Promise<ContentGeneration> {
    const { data, error } = await this.client
      .from('content_generations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur update content_generation: ${error.message}`);
    }

    return data;
  }

  async getContentGenerationByWorkflowId(
    workflowId: string
  ): Promise<ContentGeneration | null> {
    const { data, error } = await this.client
      .from('content_generations')
      .select('*')
      .eq('workflow_id', workflowId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found (OK)
      throw new Error(`Erreur récupération generation: ${error.message}`);
    }

    return data;
  }

  // ==========================================
  // GENERATED IMAGES
  // ==========================================

  async createGeneratedImage(data: {
    generation_id: string;
    supabase_path: string;
    public_url: string;
    dalle_prompt: string;
    size?: string;
  }): Promise<GeneratedImage> {
    const { data: image, error } = await this.client
      .from('generated_images')
      .insert({
        generation_id: data.generation_id,
        supabase_path: data.supabase_path,
        public_url: data.public_url,
        dalle_prompt: data.dalle_prompt,
        size: data.size || '1792x1024',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création generated_image: ${error.message}`);
    }

    return image;
  }

  async uploadImageToStorage(
    buffer: Buffer,
    fileName: string,
    contentType: string = 'image/png'
  ): Promise<{ path: string; publicUrl: string }> {
    const { data, error } = await this.client.storage
      .from('generated-images')
      .upload(fileName, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erreur upload image Supabase Storage: ${error.message}`);
    }

    // Récupérer URL publique
    const {
      data: { publicUrl },
    } = this.client.storage.from('generated-images').getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl,
    };
  }

  // ==========================================
  // FACEBOOK POSTS
  // ==========================================

  async createFacebookPost(data: {
    generation_id: string;
    content: string;
    image_url?: string;
    scheduled_for?: Date;
  }): Promise<FacebookPost> {
    const { data: post, error } = await this.client
      .from('facebook_posts')
      .insert({
        generation_id: data.generation_id,
        content: data.content,
        image_url: data.image_url,
        status: data.scheduled_for ? 'scheduled' : 'pending',
        scheduled_for: data.scheduled_for?.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création facebook_post: ${error.message}`);
    }

    return post;
  }

  async updateFacebookPost(
    id: string,
    updates: Partial<FacebookPost>
  ): Promise<FacebookPost> {
    const { data, error } = await this.client
      .from('facebook_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur update facebook_post: ${error.message}`);
    }

    return data;
  }

  // ==========================================
  // POST ANALYTICS
  // ==========================================

  async createPostAnalytics(data: {
    post_id: string;
    facebook_post_id: string;
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  }): Promise<PostAnalytics> {
    const { data: analytics, error } = await this.client
      .from('post_analytics')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création post_analytics: ${error.message}`);
    }

    return analytics;
  }

  // ==========================================
  // APPROVAL QUEUE
  // ==========================================

  async createApprovalQueueItem(data: {
    generation_id: string;
    workflow_id: string;
    variations: any[];
    image_url?: string;
  }): Promise<ApprovalQueue> {
    const { data: item, error } = await this.client
      .from('approval_queue')
      .insert({
        generation_id: data.generation_id,
        workflow_id: data.workflow_id,
        variations: data.variations,
        image_url: data.image_url,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création approval_queue: ${error.message}`);
    }

    return item;
  }

  async updateApprovalQueueItem(
    workflowId: string,
    updates: Partial<ApprovalQueue>
  ): Promise<ApprovalQueue> {
    const { data, error } = await this.client
      .from('approval_queue')
      .update(updates)
      .eq('workflow_id', workflowId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur update approval_queue: ${error.message}`);
    }

    return data;
  }

  async getApprovalQueueByWorkflowId(
    workflowId: string
  ): Promise<ApprovalQueue | null> {
    const { data, error } = await this.client
      .from('approval_queue')
      .select('*')
      .eq('workflow_id', workflowId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erreur récupération approval_queue: ${error.message}`);
    }

    return data;
  }

  // ==========================================
  // SYSTEM LOGS
  // ==========================================

  async createSystemLog(data: {
    log_level: 'info' | 'warn' | 'error';
    component: string;
    message: string;
    metadata?: any;
  }): Promise<void> {
    const { error } = await this.client.from('system_logs').insert({
      log_level: data.log_level,
      component: data.component,
      message: data.message,
      metadata: data.metadata || {},
    });

    if (error) {
      console.error('[Supabase] Erreur création system_log:', error);
      // Ne pas throw pour éviter de bloquer le workflow
    }
  }
}

// Exporter instance singleton
export const supabase = SupabaseService.getInstance();
export default supabase;
