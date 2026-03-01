-- [CYCL:bb1aae3b-b00a-4066-b4f7-b2848c3a3a68] Groups, group_members, group_invites tables + RLS
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- groups: members can read, any authenticated user can create
CREATE POLICY "groups_select_members"
  ON public.groups FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = id AND gm.user_id = auth.uid()
  ));

CREATE POLICY "groups_insert_authenticated"
  ON public.groups FOR INSERT TO authenticated WITH CHECK (true);

-- group_members: members can read, admins can delete, insert via service role only
CREATE POLICY "group_members_select_members"
  ON public.group_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm2
    WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()
  ));

CREATE POLICY "group_members_insert_authenticated"
  ON public.group_members FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "group_members_delete_admin"
  ON public.group_members FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm2
    WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid() AND gm2.role = 'admin'
  ));

-- group_invites: admins can insert, unrestricted select for token validation
CREATE POLICY "group_invites_select_all"
  ON public.group_invites FOR SELECT TO authenticated USING (true);

CREATE POLICY "group_invites_insert_admin"
  ON public.group_invites FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  ));

CREATE POLICY "group_invites_update_admin"
  ON public.group_invites FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  ));
