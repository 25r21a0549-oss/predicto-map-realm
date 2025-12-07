import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useSavedAreas } from '@/hooks/useSavedAreas';
import { usePredictions } from '@/hooks/usePredictions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, TrendingUp, Settings, Save, Trash2 } from 'lucide-react';

interface Profile {
  full_name: string | null;
  email: string | null;
  preferences: unknown;
}

export default function Account() {
  const { user } = useAuth();
  const { areas, deleteArea } = useSavedAreas();
  const { predictions } = usePredictions();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile>({ full_name: null, email: null, preferences: {} });
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      toast({ title: 'Error updating profile', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated successfully' });
      setProfile(prev => ({ ...prev, full_name: fullName }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <User className="h-6 w-6" />
          Account
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <Button onClick={updateProfile} disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Saved Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Saved Areas ({areas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {areas.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No saved areas</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {areas.map(area => (
                    <div key={area.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{area.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(area.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteArea(area.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm">Total Predictions</span>
                  <span className="font-bold">{predictions.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm">Saved Areas</span>
                  <span className="font-bold">{areas.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm">Member Since</span>
                  <span className="font-bold text-sm">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted-foreground">Email notifications for price changes</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Default Location</p>
                  <p className="text-sm text-muted-foreground">India (Default)</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Currency</p>
                  <p className="text-sm text-muted-foreground">INR (₹)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
