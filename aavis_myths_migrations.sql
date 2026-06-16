-- Create ENUM for Myth Category
CREATE TYPE public.myth_category AS ENUM (
    'Nutrition',
    'Food Safety',
    'Protein',
    'Sugar',
    'Diabetes',
    'Vegan',
    'Additives',
    'General Health'
);

-- Create Saved Myths table
CREATE TABLE public.saved_myths (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    question text NOT NULL,
    correct_answer text NOT NULL,
    user_answer text,
    is_correct boolean,
    explanation text,
    sources jsonb, -- [{ name, url }]
    category public.myth_category NOT NULL DEFAULT 'Nutrition',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, question, correct_answer)
);

-- Enable RLS
ALTER TABLE public.saved_myths ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view own myths"
ON public.saved_myths
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own myths"
ON public.saved_myths
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own myths"
ON public.saved_myths
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own myths"
ON public.saved_myths
FOR UPDATE
USING (auth.uid() = user_id);
