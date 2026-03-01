-- [CYCL:625421ab-4d0b-4318-b76a-e7e561ad3a77] Weekly summaries table + RLS
CREATE TABLE IF NOT EXISTS public.weekly_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  iso_week int2 NOT NULL,
  iso_year int2 NOT NULL,
  summary_text text NOT NULL,
  tip_text text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, iso_week, iso_year)
);

ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_summaries_own"
  ON public.weekly_summaries FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
