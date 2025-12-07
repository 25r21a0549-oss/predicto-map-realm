import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Prediction {
  id: string;
  user_id: string;
  area_id: string | null;
  predicted_price: number | null;
  amenities_score: number | null;
  roi_percentage: number | null;
  input_features: Record<string, unknown>;
  created_at: string;
}

export const usePredictions = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPredictions = async () => {
    if (!user) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching predictions', description: error.message, variant: 'destructive' });
    } else {
      setPredictions(data as Prediction[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPredictions();
  }, [user]);

  const savePrediction = async (prediction: { area_id?: string | null; predicted_price?: number | null; amenities_score?: number | null; roi_percentage?: number | null; input_features?: Record<string, unknown> }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('predictions')
      .insert({ ...prediction, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error saving prediction', description: error.message, variant: 'destructive' });
      return { error };
    }

    setPredictions(prev => [data as Prediction, ...prev]);
    toast({ title: 'Prediction saved' });
    return { data };
  };

  return { predictions, loading, savePrediction, refetch: fetchPredictions };
};
