import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSavedAreas } from '@/hooks/useSavedAreas';
import { usePredictions } from '@/hooks/usePredictions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Calculator, TrendingUp, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ROIResult {
  areaId: string;
  areaName: string;
  investmentAmount: number;
  predictedValue: number;
  roiPercentage: number;
  annualReturn: number;
}

export default function ROI() {
  const { areas, loading: areasLoading } = useSavedAreas();
  const { predictions, savePrediction } = usePredictions();
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [investmentAmount, setInvestmentAmount] = useState('5000000');
  const [holdingPeriod, setHoldingPeriod] = useState('5');
  const [roiResults, setRoiResults] = useState<ROIResult[]>([]);

  const calculateROI = () => {
    const area = areas.find(a => a.id === selectedAreaId);
    if (!area) return;

    const investment = parseInt(investmentAmount);
    const years = parseInt(holdingPeriod);
    
    // Simulated appreciation rate (would come from ML model)
    const appreciationRate = 0.08 + Math.random() * 0.04; // 8-12% annual
    const futureValue = investment * Math.pow(1 + appreciationRate, years);
    const roi = ((futureValue - investment) / investment) * 100;
    const annualReturn = roi / years;

    const newResult: ROIResult = {
      areaId: area.id,
      areaName: area.name,
      investmentAmount: investment,
      predictedValue: Math.round(futureValue),
      roiPercentage: Math.round(roi * 10) / 10,
      annualReturn: Math.round(annualReturn * 10) / 10,
    };

    setRoiResults(prev => {
      const filtered = prev.filter(r => r.areaId !== area.id);
      return [...filtered, newResult];
    });

    // Save prediction with ROI
    savePrediction({
      area_id: area.id,
      predicted_price: futureValue,
      amenities_score: null,
      roi_percentage: roi,
      input_features: {
        investmentAmount: investment,
        holdingPeriod: years,
      },
    });
  };

  const chartData = useMemo(() => 
    roiResults.map(r => ({
      name: r.areaName.length > 15 ? r.areaName.substring(0, 15) + '...' : r.areaName,
      roi: r.roiPercentage,
      annual: r.annualReturn,
    })), [roiResults]
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <PieChart className="h-6 w-6" />
          ROI Calculator
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculate ROI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Saved Area</Label>
                <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {area.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {areasLoading && <p className="text-sm text-muted-foreground">Loading areas...</p>}
                {!areasLoading && areas.length === 0 && (
                  <p className="text-sm text-muted-foreground">No saved areas. Save areas from the Predictor page first.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Investment Amount (₹)</Label>
                <Input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter investment amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Holding Period (Years)</Label>
                <Select value={holdingPeriod} onValueChange={setHoldingPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Year</SelectItem>
                    <SelectItem value="3">3 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                    <SelectItem value="10">10 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={calculateROI} 
                className="w-full" 
                disabled={!selectedAreaId}
              >
                Calculate ROI
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                ROI Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roiResults.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="roi" name="Total ROI %" fill="hsl(var(--primary))" />
                      <Bar dataKey="annual" name="Annual Return %" fill="hsl(var(--muted-foreground))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Calculate ROI for saved areas to see comparison</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {roiResults.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>ROI Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area</TableHead>
                    <TableHead className="text-right">Investment</TableHead>
                    <TableHead className="text-right">Predicted Value</TableHead>
                    <TableHead className="text-right">Total ROI</TableHead>
                    <TableHead className="text-right">Annual Return</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roiResults.map(result => (
                    <TableRow key={result.areaId}>
                      <TableCell className="font-medium">{result.areaName}</TableCell>
                      <TableCell className="text-right">₹{result.investmentAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{result.predictedValue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">{result.roiPercentage}%</TableCell>
                      <TableCell className="text-right">{result.annualReturn}%/yr</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
