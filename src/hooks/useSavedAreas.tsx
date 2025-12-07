import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SavedArea {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  bounds?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export const useSavedAreas = () => {
  const [areas, setAreas] = useState<SavedArea[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAreas = async () => {
    if (!user) {
      setAreas([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('saved_areas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching areas', description: error.message, variant: 'destructive' });
    } else {
      setAreas(data as SavedArea[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAreas();
  }, [user]);

  const saveArea = async (area: { name: string; latitude: number; longitude: number; bounds?: Record<string, unknown> | null; metadata?: Record<string, unknown> | null }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('saved_areas')
      .insert({ ...area, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error saving area', description: error.message, variant: 'destructive' });
      return { error };
    }

    setAreas(prev => [data as SavedArea, ...prev]);
    toast({ title: 'Area saved successfully' });
    return { data };
  };

  const deleteArea = async (id: string) => {
    const { error } = await supabase.from('saved_areas').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error deleting area', description: error.message, variant: 'destructive' });
      return { error };
    }

    setAreas(prev => prev.filter(a => a.id !== id));
    toast({ title: 'Area deleted' });
    return { success: true };
  };

  return { areas, loading, saveArea, deleteArea, refetch: fetchAreas };
};
