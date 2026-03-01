-- [CYCL:c7207409-30f0-41ec-bab5-24b0689f7beb] Habit logs table + unique constraint + RLS
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id uuid REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, user_id, completed_date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own logs
CREATE POLICY "habit_logs_insert_own"
  ON public.habit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own logs
CREATE POLICY "habit_logs_select_own"
  ON public.habit_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Group members can read logs for group habits
CREATE POLICY "habit_logs_select_group"
  ON public.habit_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.habits h
    JOIN public.group_members gm ON gm.group_id = h.group_id
    WHERE h.id = habit_logs.habit_id
      AND h.group_id IS NOT NULL
      AND gm.user_id = auth.uid()
  ));
