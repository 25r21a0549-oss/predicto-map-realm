-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create saved_areas table
CREATE TABLE public.saved_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  bounds JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.saved_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own areas" ON public.saved_areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own areas" ON public.saved_areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own areas" ON public.saved_areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own areas" ON public.saved_areas FOR DELETE USING (auth.uid() = user_id);

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  area_id UUID REFERENCES public.saved_areas(id) ON DELETE CASCADE,
  predicted_price DECIMAL(15, 2),
  amenities_score DECIMAL(3, 2),
  roi_percentage DECIMAL(5, 2),
  input_features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own predictions" ON public.predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own predictions" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own predictions" ON public.predictions FOR DELETE USING (auth.uid() = user_id);

-- Trigger for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();