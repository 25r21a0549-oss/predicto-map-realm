import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, TrendingUp, PieChart, Building, ArrowRight } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();

  const features = [
    {
      icon: Map,
      title: 'Interactive Maps',
      description: 'Select and save locations using OpenStreetMap integration',
    },
    {
      icon: TrendingUp,
      title: 'Price Prediction',
      description: 'ML-powered price predictions based on location and property features',
    },
    {
      icon: PieChart,
      title: 'ROI Analysis',
      description: 'Calculate and compare returns on investment across saved areas',
    },
    {
      icon: Building,
      title: 'Amenities Score',
      description: 'Evaluate nearby schools, hospitals, shopping centers, and more',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Real Estate Price Prediction
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Make smarter property investment decisions with ML-powered price predictions, 
            ROI analysis, and comprehensive location insights.
          </p>
          
          {!loading && (
            <div className="flex justify-center gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="gap-2">
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="lg" className="gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* CTA Section */}
        {!user && !loading && (
          <section className="text-center bg-primary/5 rounded-2xl p-12">
            <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
            <p className="text-muted-foreground mb-6">
              Create a free account to save locations, get predictions, and analyze ROI.
            </p>
            <Link to="/auth">
              <Button size="lg">Create Free Account</Button>
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
