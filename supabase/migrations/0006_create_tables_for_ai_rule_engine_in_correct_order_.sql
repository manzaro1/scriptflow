
-- 1. AI Rule Permissions (RBAC)
CREATE TABLE IF NOT EXISTS public.ai_rule_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.ai_rule_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own permissions" ON public.ai_rule_permissions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. AI Rules table
CREATE TABLE IF NOT EXISTS public.ai_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL, -- The actual rule/code
  schema_validation JSONB, -- For input validation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.ai_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read rules" ON public.ai_rules
FOR SELECT TO authenticated USING (true);

-- 3. AI Rule Versions table
CREATE TABLE IF NOT EXISTS public.ai_rule_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.ai_rules(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.ai_rule_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read versions" ON public.ai_rule_versions
FOR SELECT TO authenticated USING (true);
