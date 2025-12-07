import { useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSavedAreas } from '@/hooks/useSavedAreas';
import { usePredictions } from '@/hooks/usePredictions';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LayoutDashboard, MapPin, TrendingUp, PieChart, Lightbulb, ArrowRight, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { areas, loading: areasLoading, deleteArea } = useSavedAreas();
  const { predictions, loading: predictionsLoading } = usePredictions();

  const stats = useMemo(() => {
    const totalPredictedValue = predictions.reduce((sum, p) => sum + (p.predicted_price || 0), 0);
    const avgROI = predictions.filter(p => p.roi_percentage).reduce((sum, p, _, arr) => 
      sum + (p.roi_percentage || 0) / arr.length, 0);
    
    return {
      savedAreas: areas.length,
      totalPredictions: predictions.length,
      totalValue: totalPredictedValue,
      avgROI: Math.round(avgROI * 10) / 10,
    };
  }, [areas, predictions]);

  const recommendations = [
    { title: 'Explore High-Growth Areas', description: 'Areas near upcoming metro stations show 15-20% higher appreciation.' },
    { title: 'Diversify Locations', description: 'Consider spreading investments across 2-3 different localities.' },
    { title: 'Monitor Market Trends', description: 'Property prices in this region have increased 8% in the last quarter.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saved Areas</p>
                  <p className="text-2xl font-bold">{stats.savedAreas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Predictions</p>
                  <p className="text-2xl font-bold">{stats.totalPredictions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <PieChart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg ROI</p>
                  <p className="text-2xl font-bold">{stats.avgROI || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Saved Areas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Saved Areas
              </CardTitle>
              <Link to="/predictor">
                <Button variant="ghost" size="sm">
                  Add New <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {areasLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : areas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved areas yet</p>
                  <Link to="/predictor">
                    <Button variant="link">Start exploring</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {areas.slice(0, 5).map(area => (
                    <div key={area.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium">{area.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
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

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-secondary/50 rounded-lg">
                    <p className="font-medium">{rec.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Predictions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Predictions
              </CardTitle>
              <Link to="/predictor">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {predictionsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : predictions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No predictions yet</p>
                  <Link to="/predictor">
                    <Button variant="link">Make your first prediction</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {predictions.slice(0, 6).map(prediction => (
                    <div key={prediction.id} className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        ₹{(prediction.predicted_price || 0).toLocaleString()}
                      </p>
                      {prediction.roi_percentage && (
                        <p className="text-sm text-green-600">ROI: {prediction.roi_percentage}%</p>
                      )}
                      {prediction.amenities_score && (
                        <p className="text-xs text-muted-foreground">
                          Amenities: {Math.round(prediction.amenities_score * 100)}%
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(prediction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
