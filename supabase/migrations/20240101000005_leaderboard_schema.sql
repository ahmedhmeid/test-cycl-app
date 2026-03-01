-- [CYCL:cb95563a-41fa-49af-9e7a-14fefce07e1a] Leaderboard: kudos, badges, notification_preferences, notifications tables + RLS
CREATE TABLE IF NOT EXISTS public.kudos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid REFERENCES auth.users(id) NOT NULL,
  to_user_id uuid REFERENCES auth.users(id) NOT NULL,
  group_id uuid REFERENCES public.groups(id) NOT NULL,
  habit_id uuid REFERENCES public.habits(id),
  emoji text DEFAULT '🔥' NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (from_user_id <> to_user_id)
);

CREATE TABLE IF NOT EXISTS public.badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  group_id uuid REFERENCES public.groups(id) NOT NULL,
  habit_id uuid REFERENCES public.habits(id),
  type text NOT NULL CHECK (type IN ('streak_7','streak_30','streak_60','streak_100')),
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, group_id, habit_id, type)
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  group_id uuid REFERENCES public.groups(id) NOT NULL,
  rank_overtake boolean DEFAULT true NOT NULL,
  milestone_celebrations boolean DEFAULT true NOT NULL,
  PRIMARY KEY (user_id, group_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('rank_overtake', 'milestone')),
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- kudos: group members can read and insert (not kudo yourself enforced by CHECK)
CREATE POLICY "kudos_select_group_members"
  ON public.kudos FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = kudos.group_id AND gm.user_id = auth.uid()
  ));

CREATE POLICY "kudos_insert_group_members"
  ON public.kudos FOR INSERT TO authenticated
  WITH CHECK (
    from_user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = kudos.group_id AND gm.user_id = auth.uid()
    )
  );

-- badges: group members can read, only service role inserts
CREATE POLICY "badges_select_group_members"
  ON public.badges FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = badges.group_id AND gm.user_id = auth.uid()
  ));

CREATE POLICY "badges_insert_authenticated"
  ON public.badges FOR INSERT TO authenticated WITH CHECK (true);

-- notification_preferences: users manage own rows
CREATE POLICY "notif_prefs_select_own"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notif_prefs_insert_own"
  ON public.notification_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notif_prefs_update_own"
  ON public.notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- notifications: users can only read own
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_user_date ON public.habit_logs(habit_id, user_id, completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_kudos_group ON public.kudos(group_id);
CREATE INDEX IF NOT EXISTS idx_badges_user_group ON public.badges(user_id, group_id);
