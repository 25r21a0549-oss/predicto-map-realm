import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { MapComponent } from '@/components/MapComponent';
import { useSavedAreas } from '@/hooks/useSavedAreas';
import { usePredictions } from '@/hooks/usePredictions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Building, TreePine, School, Hospital, ShoppingCart, Save, Landmark, Calendar } from 'lucide-react';

const SQFT_PER_ACRE = 43560;

export default function Predictor() {
  const { saveArea } = useSavedAreas();
  const { savePrediction } = usePredictions();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [landType, setLandType] = useState('residential');
  const [area, setArea] = useState('1000');
  const [yearsIntoFuture, setYearsIntoFuture] = useState('5');
  const [prediction, setPrediction] = useState<{
    currentPriceMin: number;
    currentPriceMax: number;
    futurePriceMin: number;
    futurePriceMax: number;
    amenitiesScore: number;
    confidence: number;
    landType: string;
    areaSqft: number;
    areaAcres: number;
    years: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate amenities score based on location (simulated)
  const calculateAmenitiesScore = (lat: number, lng: number) => {
    // This would connect to your ML backend
    const baseScore = Math.random() * 0.4 + 0.5; // 0.5-0.9
    return Math.round(baseScore * 100) / 100;
  };

  // Get land type multiplier
  const getLandTypeMultiplier = (type: string) => {
    const multipliers: Record<string, number> = {
      commercial: 1.8,
      residential: 1.0,
      industrial: 1.4,
      agricultural: 0.5,
      'mixed-use': 1.3,
    };
    return multipliers[type] || 1.0;
  };

  // Get land type display name
  const getLandTypeDisplayName = (type: string) => {
    const names: Record<string, string> = {
      commercial: 'Commercial',
      residential: 'Residential',
      industrial: 'Industrial',
      agricultural: 'Agricultural',
      'mixed-use': 'Mixed Use',
    };
    return names[type] || type;
  };

  // Predict price (simulated - connect to your ML endpoint)
  const predictPrice = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    
    // Simulate API call to ML model
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const areaSqft = parseInt(area) || 0;
    const areaAcres = areaSqft / SQFT_PER_ACRE;
    const years = parseInt(yearsIntoFuture) || 5;
    
    // Base price per sqft based on location
    const basePricePerSqft = 4000 + Math.random() * 3000;
    const landTypeMultiplier = getLandTypeMultiplier(landType);
    const locationMultiplier = 0.8 + Math.random() * 0.4;
    
    // Calculate current price range (±15% variation)
    const currentBasePrice = basePricePerSqft * areaSqft * landTypeMultiplier * locationMultiplier;
    const currentPriceMin = Math.round(currentBasePrice * 0.85);
    const currentPriceMax = Math.round(currentBasePrice * 1.15);
    
    // Calculate future price with compound appreciation (5-10% per year)
    const appreciationRate = 0.05 + Math.random() * 0.05;
    const futureMultiplier = Math.pow(1 + appreciationRate, years);
    const futurePriceMin = Math.round(currentPriceMin * futureMultiplier);
    const futurePriceMax = Math.round(currentPriceMax * futureMultiplier);
    
    const amenitiesScore = calculateAmenitiesScore(selectedLocation.lat, selectedLocation.lng);
    
    setPrediction({
      currentPriceMin,
      currentPriceMax,
      futurePriceMin,
      futurePriceMax,
      amenitiesScore,
      confidence: Math.round((0.7 + Math.random() * 0.25) * 100),
      landType,
      areaSqft,
      areaAcres,
      years,
    });
    
    setLoading(false);
  };

  const handleSaveArea = async (areaData: { name: string; latitude: number; longitude: number; metadata?: Record<string, unknown> }) => {
    await saveArea(areaData);
  };

  const handleSavePrediction = async () => {
    if (!prediction || !selectedLocation) return;
    
    await savePrediction({
      area_id: null,
      predicted_price: (prediction.currentPriceMin + prediction.currentPriceMax) / 2,
      amenities_score: prediction.amenitiesScore,
      roi_percentage: null,
      input_features: {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        landType: prediction.landType,
        areaSqft: prediction.areaSqft,
        areaAcres: prediction.areaAcres,
        yearsIntoFuture: prediction.years,
        currentPriceRange: { min: prediction.currentPriceMin, max: prediction.currentPriceMax },
        futurePriceRange: { min: prediction.futurePriceMin, max: prediction.futurePriceMax },
      },
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const amenityItems = [
    { icon: School, label: 'Schools', score: prediction ? Math.round(prediction.amenitiesScore * 100) : 0 },
    { icon: Hospital, label: 'Healthcare', score: prediction ? Math.round((prediction.amenitiesScore * 0.9) * 100) : 0 },
    { icon: ShoppingCart, label: 'Shopping', score: prediction ? Math.round((prediction.amenitiesScore * 1.1) * 100) : 0 },
    { icon: TreePine, label: 'Parks', score: prediction ? Math.round((prediction.amenitiesScore * 0.85) * 100) : 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Land Price Predictor
        </h1>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <MapComponent
              onSaveArea={handleSaveArea}
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              height="350px"
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Land Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      Land Type
                    </Label>
                    <Select value={landType} onValueChange={setLandType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="agricultural">Agricultural</SelectItem>
                        <SelectItem value="mixed-use">Mixed Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Years Into Future
                    </Label>
                    <Input
                      type="number"
                      value={yearsIntoFuture}
                      onChange={(e) => setYearsIntoFuture(e.target.value)}
                      placeholder="e.g., 5"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Area (sq ft)</Label>
                  <Input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Enter area in sq ft"
                  />
                  {area && parseInt(area) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      = {(parseInt(area) / SQFT_PER_ACRE).toFixed(4)} acres
                    </p>
                  )}
                </div>
                <Button 
                  onClick={predictPrice} 
                  className="w-full" 
                  disabled={!selectedLocation || loading}
                >
                  {loading ? 'Predicting...' : 'Predict Price'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {prediction && (
              <>
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle>Price Prediction Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Input Summary */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-lg text-sm">
                      <div>
                        <p className="text-muted-foreground">Land Type</p>
                        <p className="font-medium">{getLandTypeDisplayName(prediction.landType)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prediction Period</p>
                        <p className="font-medium">{prediction.years} Years</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Area (sqft)</p>
                        <p className="font-medium">{prediction.areaSqft.toLocaleString()} sqft</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Area (acres)</p>
                        <p className="font-medium">{prediction.areaAcres.toFixed(4)} acres</p>
                      </div>
                    </div>

                    {/* Current Price Range */}
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Current Estimated Price Range</p>
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(prediction.currentPriceMin)} – {formatPrice(prediction.currentPriceMax)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Per acre: {formatPrice(prediction.currentPriceMin / prediction.areaAcres)} – {formatPrice(prediction.currentPriceMax / prediction.areaAcres)}
                      </p>
                    </div>

                    {/* Future Price Range */}
                    <div className="p-4 bg-accent/20 rounded-lg border border-accent/30">
                      <p className="text-sm text-muted-foreground mb-1">
                        Future Price Range (after {prediction.years} years)
                      </p>
                      <div className="text-2xl font-bold text-accent-foreground">
                        {formatPrice(prediction.futurePriceMin)} – {formatPrice(prediction.futurePriceMax)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Per acre: {formatPrice(prediction.futurePriceMin / prediction.areaAcres)} – {formatPrice(prediction.futurePriceMax / prediction.areaAcres)}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Confidence: {prediction.confidence}%
                    </p>
                    
                    <Button onClick={handleSavePrediction} variant="outline" className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Save Prediction
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Amenities Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">
                      {Math.round(prediction.amenitiesScore * 100)}
                      <span className="text-lg text-muted-foreground">/100</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {amenityItems.map(({ icon: Icon, label, score }) => (
                        <div key={label} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">{Math.min(score, 100)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!prediction && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a location and enter land details to get a price prediction</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
