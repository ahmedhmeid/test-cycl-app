-- [CYCL:f40345c7-736b-484d-88bc-93deca6c6528] Habits table + RLS
CREATE TABLE IF NOT EXISTS public.habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text DEFAULT '✅',
  description text,
  schedule jsonb DEFAULT '[0,1,2,3,4,5,6]'::jsonb NOT NULL,
  archived boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Group members can read group habits
CREATE POLICY "habits_select_group_members"
  ON public.habits FOR SELECT TO authenticated
  USING (
    group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = habits.group_id AND gm.user_id = auth.uid()
    )
  );

-- Owner can read private habits
CREATE POLICY "habits_select_private_owner"
  ON public.habits FOR SELECT TO authenticated
  USING (group_id IS NULL AND created_by = auth.uid());

-- Group admin can create group habits
CREATE POLICY "habits_insert_group_admin"
  ON public.habits FOR INSERT TO authenticated
  WITH CHECK (
    group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = habits.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Any authenticated user can create private habits
CREATE POLICY "habits_insert_private"
  ON public.habits FOR INSERT TO authenticated
  WITH CHECK (group_id IS NULL AND created_by = auth.uid());

-- Group admin can update group habits
CREATE POLICY "habits_update_group_admin"
  ON public.habits FOR UPDATE TO authenticated
  USING (
    group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = habits.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Owner can update private habits
CREATE POLICY "habits_update_private_owner"
  ON public.habits FOR UPDATE TO authenticated
  USING (group_id IS NULL AND created_by = auth.uid());
