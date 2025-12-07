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
import { TrendingUp, Building, TreePine, School, Hospital, ShoppingCart, Save } from 'lucide-react';

export default function Predictor() {
  const { saveArea } = useSavedAreas();
  const { savePrediction } = usePredictions();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [propertyType, setPropertyType] = useState('apartment');
  const [bedrooms, setBedrooms] = useState('2');
  const [area, setArea] = useState('1000');
  const [prediction, setPrediction] = useState<{
    price: number;
    amenitiesScore: number;
    confidence: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate amenities score based on location (simulated)
  const calculateAmenitiesScore = (lat: number, lng: number) => {
    // This would connect to your ML backend
    const baseScore = Math.random() * 0.4 + 0.5; // 0.5-0.9
    return Math.round(baseScore * 100) / 100;
  };

  // Predict price (simulated - connect to your ML endpoint)
  const predictPrice = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    
    // Simulate API call to ML model
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const basePrice = parseInt(area) * 5000;
    const bedroomMultiplier = 1 + parseInt(bedrooms) * 0.1;
    const typeMultiplier = propertyType === 'villa' ? 1.5 : propertyType === 'house' ? 1.2 : 1;
    const locationMultiplier = 0.8 + Math.random() * 0.4;
    
    const predictedPrice = Math.round(basePrice * bedroomMultiplier * typeMultiplier * locationMultiplier);
    const amenitiesScore = calculateAmenitiesScore(selectedLocation.lat, selectedLocation.lng);
    
    setPrediction({
      price: predictedPrice,
      amenitiesScore,
      confidence: Math.round((0.7 + Math.random() * 0.25) * 100),
    });
    
    setLoading(false);
  };

  const handleSaveArea = async (areaData: { name: string; latitude: number; longitude: number; metadata?: object }) => {
    await saveArea(areaData);
  };

  const handleSavePrediction = async () => {
    if (!prediction || !selectedLocation) return;
    
    await savePrediction({
      area_id: null,
      predicted_price: prediction.price,
      amenities_score: prediction.amenitiesScore,
      roi_percentage: null,
      input_features: {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        propertyType,
        bedrooms: parseInt(bedrooms),
        area: parseInt(area),
      },
    });
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
          Price Predictor
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
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bedrooms</Label>
                    <Select value={bedrooms} onValueChange={setBedrooms}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 BHK</SelectItem>
                        <SelectItem value="2">2 BHK</SelectItem>
                        <SelectItem value="3">3 BHK</SelectItem>
                        <SelectItem value="4">4+ BHK</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <CardTitle>Predicted Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">
                      ₹{prediction.price.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Confidence: {prediction.confidence}%
                    </p>
                    <Button onClick={handleSavePrediction} variant="outline" className="mt-4 w-full">
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
                  <p>Select a location and enter property details to get a price prediction</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
