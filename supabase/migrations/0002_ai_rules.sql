-- Migration 0002: AI Rules Engine Schema
-- ai_rule_permissions, ai_rules, ai_rule_versions

-- 1. AI Rule Permissions (RBAC)
CREATE TABLE IF NOT EXISTS public.ai_rule_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
ALTER TABLE public.ai_rule_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_rule_permissions_owner" ON public.ai_rule_permissions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 2. AI Rules
CREATE TABLE IF NOT EXISTS public.ai_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  schema_validation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.ai_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_rules_select" ON public.ai_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_rules_insert" ON public.ai_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "ai_rules_update" ON public.ai_rules FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "ai_rules_delete" ON public.ai_rules FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- 3. AI Rule Versions
CREATE TABLE IF NOT EXISTS public.ai_rule_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.ai_rules(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.ai_rule_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_rule_versions_select" ON public.ai_rule_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_rule_versions_insert" ON public.ai_rule_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);