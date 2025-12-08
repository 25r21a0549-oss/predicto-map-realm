import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSavedAreas, SavedArea } from '@/hooks/useSavedAreas';
import { usePredictions } from '@/hooks/usePredictions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { GitCompare, MapPin, TrendingUp, Building, TreePine, ArrowRight, Award, AlertCircle } from 'lucide-react';

interface AreaMetrics {
  predictedPrice: number;
  amenitiesScore: number;
  roiPercentage: number;
  developmentScore: number;
}

export default function Compare() {
  const { areas, loading: areasLoading } = useSavedAreas();
  const { predictions } = usePredictions();
  const [areaOneId, setAreaOneId] = useState<string>('');
  const [areaTwoId, setAreaTwoId] = useState<string>('');

  const getAreaMetrics = (area: SavedArea): AreaMetrics => {
    // Find related predictions for this area
    const areaPredictions = predictions.filter(p => p.area_id === area.id);
    
    // Get the latest prediction if exists
    const latestPrediction = areaPredictions.length > 0 ? areaPredictions[0] : null;
    
    // Calculate metrics (using stored values or simulated defaults)
    const predictedPrice = latestPrediction?.predicted_price || Math.round(5000000 + Math.random() * 10000000);
    const amenitiesScore = latestPrediction?.amenities_score || Math.round(50 + Math.random() * 50);
    const roiPercentage = latestPrediction?.roi_percentage || Math.round(8 + Math.random() * 12);
    
    // Development score based on metadata or calculated
    const metadata = area.metadata as Record<string, unknown> | null;
    const developmentScore = (metadata?.developmentScore as number) || Math.round(60 + Math.random() * 40);

    return {
      predictedPrice,
      amenitiesScore,
      roiPercentage,
      developmentScore,
    };
  };

  const areaOne = useMemo(() => areas.find(a => a.id === areaOneId), [areas, areaOneId]);
  const areaTwo = useMemo(() => areas.find(a => a.id === areaTwoId), [areas, areaTwoId]);

  const metricsOne = useMemo(() => areaOne ? getAreaMetrics(areaOne) : null, [areaOne, predictions]);
  const metricsTwo = useMemo(() => areaTwo ? getAreaMetrics(areaTwo) : null, [areaTwo, predictions]);

  const comparisonItems = useMemo(() => {
    if (!metricsOne || !metricsTwo) return [];

    return [
      {
        label: 'Predicted Price',
        icon: TrendingUp,
        valueOne: `₹${metricsOne.predictedPrice.toLocaleString()}`,
        valueTwo: `₹${metricsTwo.predictedPrice.toLocaleString()}`,
        rawOne: metricsOne.predictedPrice,
        rawTwo: metricsTwo.predictedPrice,
        higherBetter: false, // Lower price might be better for buyers
        format: 'currency',
      },
      {
        label: 'Amenities Score',
        icon: Building,
        valueOne: `${metricsOne.amenitiesScore}/100`,
        valueTwo: `${metricsTwo.amenitiesScore}/100`,
        rawOne: metricsOne.amenitiesScore,
        rawTwo: metricsTwo.amenitiesScore,
        higherBetter: true,
        format: 'score',
      },
      {
        label: 'ROI Percentage',
        icon: TrendingUp,
        valueOne: `${metricsOne.roiPercentage.toFixed(1)}%`,
        valueTwo: `${metricsTwo.roiPercentage.toFixed(1)}%`,
        rawOne: metricsOne.roiPercentage,
        rawTwo: metricsTwo.roiPercentage,
        higherBetter: true,
        format: 'percentage',
      },
      {
        label: 'Development Score',
        icon: TreePine,
        valueOne: `${metricsOne.developmentScore}/100`,
        valueTwo: `${metricsTwo.developmentScore}/100`,
        rawOne: metricsOne.developmentScore,
        rawTwo: metricsTwo.developmentScore,
        higherBetter: true,
        format: 'score',
      },
    ];
  }, [metricsOne, metricsTwo]);

  const getWinner = (rawOne: number, rawTwo: number, higherBetter: boolean): 'one' | 'two' | 'tie' => {
    if (rawOne === rawTwo) return 'tie';
    if (higherBetter) {
      return rawOne > rawTwo ? 'one' : 'two';
    }
    return rawOne < rawTwo ? 'one' : 'two';
  };

  const overallWinner = useMemo(() => {
    if (comparisonItems.length === 0) return null;
    
    let scoreOne = 0;
    let scoreTwo = 0;
    
    comparisonItems.forEach(item => {
      const winner = getWinner(item.rawOne, item.rawTwo, item.higherBetter);
      if (winner === 'one') scoreOne++;
      else if (winner === 'two') scoreTwo++;
    });

    if (scoreOne > scoreTwo) return { winner: 'one', name: areaOne?.name };
    if (scoreTwo > scoreOne) return { winner: 'two', name: areaTwo?.name };
    return { winner: 'tie', name: null };
  }, [comparisonItems, areaOne, areaTwo]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <GitCompare className="h-6 w-6" />
          Area Comparison
        </h1>

        {/* Area Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Areas to Compare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Area 1</Label>
                <Select value={areaOneId} onValueChange={setAreaOneId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select first area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas
                      .filter(a => a.id !== areaTwoId)
                      .map(area => (
                        <SelectItem key={area.id} value={area.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {area.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />
              </div>

              <div className="space-y-2">
                <Label>Area 2</Label>
                <Select value={areaTwoId} onValueChange={setAreaTwoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select second area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas
                      .filter(a => a.id !== areaOneId)
                      .map(area => (
                        <SelectItem key={area.id} value={area.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {area.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {areasLoading && (
              <p className="text-sm text-muted-foreground mt-4">Loading saved areas...</p>
            )}
            {!areasLoading && areas.length < 2 && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <p>You need at least 2 saved areas to compare. Save areas from the Predictor page.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {areaOne && areaTwo && metricsOne && metricsTwo && (
          <>
            {/* Winner Banner */}
            {overallWinner && (
              <Card className="mb-6 border-primary">
                <CardContent className="py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    {overallWinner.winner === 'tie' ? (
                      <span className="font-medium">It's a tie! Both areas perform equally.</span>
                    ) : (
                      <span className="font-medium">
                        <span className="text-primary">{overallWinner.name}</span> leads in more categories
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comparison Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Area One Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {areaOne.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {areaOne.latitude.toFixed(4)}, {areaOne.longitude.toFixed(4)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {comparisonItems.map((item, index) => {
                    const Icon = item.icon;
                    const winner = getWinner(item.rawOne, item.rawTwo, item.higherBetter);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.valueOne}</span>
                          {winner === 'one' && (
                            <Badge variant="default" className="text-xs">Best</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Area Two Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {areaTwo.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {areaTwo.latitude.toFixed(4)}, {areaTwo.longitude.toFixed(4)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {comparisonItems.map((item, index) => {
                    const Icon = item.icon;
                    const winner = getWinner(item.rawOne, item.rawTwo, item.higherBetter);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.valueTwo}</span>
                          {winner === 'two' && (
                            <Badge variant="default" className="text-xs">Best</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Side by Side Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Metric</th>
                        <th className="text-right py-3 px-4 font-medium">{areaOne.name}</th>
                        <th className="text-right py-3 px-4 font-medium">{areaTwo.name}</th>
                        <th className="text-center py-3 px-4 font-medium">Winner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonItems.map((item, index) => {
                        const winner = getWinner(item.rawOne, item.rawTwo, item.higherBetter);
                        return (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3 px-4">{item.label}</td>
                            <td className={`text-right py-3 px-4 ${winner === 'one' ? 'text-primary font-medium' : ''}`}>
                              {item.valueOne}
                            </td>
                            <td className={`text-right py-3 px-4 ${winner === 'two' ? 'text-primary font-medium' : ''}`}>
                              {item.valueTwo}
                            </td>
                            <td className="text-center py-3 px-4">
                              {winner === 'tie' ? (
                                <Badge variant="secondary">Tie</Badge>
                              ) : (
                                <Badge variant="default">
                                  {winner === 'one' ? areaOne.name.substring(0, 10) : areaTwo.name.substring(0, 10)}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {(!areaOne || !areaTwo) && areas.length >= 2 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select two areas above to compare them side by side</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
