import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Receipt, Building, Landmark, Banknote, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface TaxResult {
  stampDuty: number;
  registrationFee: number;
  propertyTax: number;
  totalCost: number;
  yearlyTax: number;
}

type AreaType = 'urban' | 'semi-urban' | 'rural';
type PropertyUsage = 'self-use' | 'rental' | 'commercial';

export default function TaxCalculator() {
  const [propertyPrice, setPropertyPrice] = useState('5000000');
  const [areaType, setAreaType] = useState<AreaType>('urban');
  const [propertyUsage, setPropertyUsage] = useState<PropertyUsage>('self-use');
  const [isWomanBuyer, setIsWomanBuyer] = useState(false);
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);

  // Tax calculation logic - can be extended to connect to backend
  const calculateTax = () => {
    const price = parseFloat(propertyPrice) || 0;
    
    if (price <= 0) return;

    // Stamp duty rates based on area and buyer type
    let stampDutyRate = 0.05; // 5% base for urban
    
    switch (areaType) {
      case 'urban':
        stampDutyRate = 0.06; // 6%
        break;
      case 'semi-urban':
        stampDutyRate = 0.05; // 5%
        break;
      case 'rural':
        stampDutyRate = 0.04; // 4%
        break;
    }

    // Discount for women buyers
    if (isWomanBuyer) {
      stampDutyRate -= 0.01; // 1% discount
    }

    const stampDuty = Math.round(price * stampDutyRate);

    // Registration fee (typically 1%)
    const registrationFee = Math.round(price * 0.01);

    // Property tax based on usage
    let yearlyTaxRate = 0;
    switch (propertyUsage) {
      case 'self-use':
        yearlyTaxRate = 0.001; // 0.1%
        break;
      case 'rental':
        yearlyTaxRate = 0.0015; // 0.15%
        break;
      case 'commercial':
        yearlyTaxRate = 0.002; // 0.2%
        break;
    }

    // Area type adjustment for property tax
    const areaMultiplier = areaType === 'urban' ? 1.2 : areaType === 'semi-urban' ? 1 : 0.8;
    const yearlyTax = Math.round(price * yearlyTaxRate * areaMultiplier);
    
    // First year property tax
    const propertyTax = yearlyTax;

    // Total one-time cost (excludes yearly tax)
    const totalCost = stampDuty + registrationFee;

    setTaxResult({
      stampDuty,
      registrationFee,
      propertyTax,
      totalCost,
      yearlyTax,
    });
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Property Tax Calculator
        </h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Property Details
              </CardTitle>
              <CardDescription>
                Enter property details to calculate applicable taxes and fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="price">Property Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(e.target.value)}
                  placeholder="Enter property price"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Area Type</Label>
                <Select value={areaType} onValueChange={(v) => setAreaType(v as AreaType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urban">Urban</SelectItem>
                    <SelectItem value="semi-urban">Semi-Urban</SelectItem>
                    <SelectItem value="rural">Rural</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Urban areas typically have higher stamp duty rates
                </p>
              </div>

              <div className="space-y-2">
                <Label>Property Usage</Label>
                <Select value={propertyUsage} onValueChange={(v) => setPropertyUsage(v as PropertyUsage)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self-use">Self Use / Residential</SelectItem>
                    <SelectItem value="rental">Rental Property</SelectItem>
                    <SelectItem value="commercial">Commercial Use</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Commercial properties have higher annual tax rates
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <input
                  type="checkbox"
                  id="womanBuyer"
                  checked={isWomanBuyer}
                  onChange={(e) => setIsWomanBuyer(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <div>
                  <Label htmlFor="womanBuyer" className="cursor-pointer">
                    Woman Buyer
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    1% stamp duty discount applicable
                  </p>
                </div>
              </div>

              <Button onClick={calculateTax} className="w-full" size="lg">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Taxes
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {taxResult ? (
              <>
                <Card className="border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Tax Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        <span>Stamp Duty</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(taxResult.stampDuty)}</span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>Registration Fee</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(taxResult.registrationFee)}</span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-3 bg-primary/10 -mx-6 px-6 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-primary" />
                        <span className="font-medium">Total One-Time Cost</span>
                      </div>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(taxResult.totalCost)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="h-5 w-5" />
                      Annual Property Tax
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span>Estimated Yearly Tax</span>
                        <span className="text-xl font-bold">{formatCurrency(taxResult.yearlyTax)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Based on {propertyUsage.replace('-', ' ')} property in {areaType} area
                      </p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">5-Year Projection</p>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map(year => (
                          <div key={year} className="text-center p-2 bg-secondary/20 rounded">
                            <p className="text-xs text-muted-foreground">Year {year}</p>
                            <p className="text-sm font-medium">
                              {formatCurrency(Math.round(taxResult.yearlyTax * Math.pow(1.03, year - 1)))}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        * Assuming 3% annual increase in property tax
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Disclaimer</p>
                        <p className="mt-1">
                          These calculations are estimates based on general rates. Actual taxes may vary 
                          based on state regulations, property location, and other factors. Consult a 
                          tax professional for accurate figures.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-dashed h-full min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter property details and click Calculate to see tax breakdown</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
