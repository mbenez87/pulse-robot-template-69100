-- Contracts Intelligence Suite Database Schema

-- Contract extractions with structured analysis
CREATE TABLE public.contract_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parties JSONB NOT NULL, -- {primary_party, counterparty, other_parties}
  term_details JSONB NOT NULL, -- {start_date, end_date, term_length, auto_renewal}
  pricing JSONB NOT NULL, -- {amount, currency, payment_terms, escalations}
  renewal_terms JSONB, -- {notice_period, renewal_conditions, auto_renewal}
  termination_clauses JSONB, -- {termination_rights, notice_periods, penalties}
  ip_provisions JSONB, -- {ownership, licensing, restrictions}
  indemnity_clauses JSONB, -- {scope, limitations, carve_outs}
  liability_cap JSONB, -- {cap_amount, exceptions, mutual_caps}
  governing_law JSONB, -- {jurisdiction, dispute_resolution, venue}
  unusual_clauses JSONB, -- {description, risk_level, notes}
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_rationale TEXT NOT NULL,
  extraction_model TEXT NOT NULL, -- 'claude-3-5-sonnet', 'gpt-4o'
  extraction_confidence FLOAT DEFAULT 0.9,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contract obligations tracking
CREATE TABLE public.contract_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_extraction_id UUID NOT NULL REFERENCES contract_extractions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  obligation_type TEXT NOT NULL, -- 'payment', 'delivery', 'review', 'renewal_notice', 'termination', 'reporting'
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  threshold_amount DECIMAL,
  threshold_metric TEXT, -- 'revenue', 'usage', 'time', 'units'
  responsible_party TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  notification_sent BOOLEAN DEFAULT false,
  notification_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue terms and forecasting
CREATE TABLE public.revenue_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_extraction_id UUID NOT NULL REFERENCES contract_extractions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sku TEXT NOT NULL,
  product_name TEXT,
  quantity DECIMAL NOT NULL,
  unit_price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_frequency TEXT NOT NULL, -- 'monthly', 'quarterly', 'annually', 'one-time'
  start_date DATE NOT NULL,
  end_date DATE,
  term_months INTEGER,
  usage_based BOOLEAN DEFAULT false,
  usage_tiers JSONB, -- {tier_1: {min: 0, max: 1000, rate: 10}, ...}
  ramp_schedule JSONB, -- {month_1: 0.5, month_2: 0.75, month_3: 1.0}
  escalation_rate FLOAT DEFAULT 0.0,
  minimum_commitment DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue forecasts (computed table)
CREATE TABLE public.revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_extraction_id UUID NOT NULL REFERENCES contract_extractions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  forecast_month DATE NOT NULL, -- first day of month
  projected_revenue DECIMAL NOT NULL,
  arr DECIMAL, -- Annual Recurring Revenue
  acv DECIMAL, -- Annual Contract Value
  variance_from_previous DECIMAL,
  variance_percentage FLOAT,
  confidence_score FLOAT DEFAULT 0.8,
  assumptions TEXT,
  ai_narrative TEXT, -- GPT-4o generated summary
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contract_extraction_id, forecast_month)
);

-- Work queue for obligations and tasks
CREATE TABLE public.work_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  obligation_id UUID REFERENCES contract_obligations(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'obligation_reminder', 'contract_review', 'renewal_notice'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  due_date DATE,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  assigned_to TEXT, -- email or user reference
  email_draft TEXT, -- AI-generated email content
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Schema history for auto-suggested schemas
CREATE TABLE public.schema_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  suggested_schema JSONB NOT NULL, -- {tables: [{name, columns: [{name, type, constraints}]}]}
  schema_description TEXT,
  ai_model TEXT NOT NULL, -- 'gpt-4o', 'gemini-1.5-pro'
  confidence_score FLOAT DEFAULT 0.8,
  status TEXT DEFAULT 'suggested', -- 'suggested', 'approved', 'implemented', 'rejected'
  migration_sql TEXT, -- Generated SQL for creating the schema
  table_names TEXT[], -- Array of created table names
  approved_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all contract tables
ALTER TABLE contract_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract extractions
CREATE POLICY "Users can manage their own contract extractions" ON contract_extractions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for contract obligations
CREATE POLICY "Users can manage their own contract obligations" ON contract_obligations
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for revenue terms
CREATE POLICY "Users can manage their own revenue terms" ON revenue_terms
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for revenue forecasts
CREATE POLICY "Users can manage their own revenue forecasts" ON revenue_forecasts
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for work queue
CREATE POLICY "Users can manage their own work queue" ON work_queue
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for schema history
CREATE POLICY "Users can manage their own schema history" ON schema_history
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_contract_extractions_document_id ON contract_extractions(document_id);
CREATE INDEX idx_contract_extractions_user_id ON contract_extractions(user_id);
CREATE INDEX idx_contract_extractions_risk_score ON contract_extractions(risk_score);

CREATE INDEX idx_contract_obligations_extraction_id ON contract_obligations(contract_extraction_id);
CREATE INDEX idx_contract_obligations_due_date ON contract_obligations(due_date);
CREATE INDEX idx_contract_obligations_status ON contract_obligations(status);

CREATE INDEX idx_revenue_terms_extraction_id ON revenue_terms(contract_extraction_id);
CREATE INDEX idx_revenue_terms_start_date ON revenue_terms(start_date);

CREATE INDEX idx_revenue_forecasts_extraction_id ON revenue_forecasts(contract_extraction_id);
CREATE INDEX idx_revenue_forecasts_month ON revenue_forecasts(forecast_month);

CREATE INDEX idx_work_queue_user_id ON work_queue(user_id);
CREATE INDEX idx_work_queue_due_date ON work_queue(due_date);
CREATE INDEX idx_work_queue_status ON work_queue(status);

CREATE INDEX idx_schema_history_document_id ON schema_history(document_id);
CREATE INDEX idx_schema_history_status ON schema_history(status);

-- Triggers for updated_at
CREATE TRIGGER update_contract_extractions_updated_at
  BEFORE UPDATE ON contract_extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_obligations_updated_at
  BEFORE UPDATE ON contract_obligations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_terms_updated_at
  BEFORE UPDATE ON revenue_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_queue_updated_at
  BEFORE UPDATE ON work_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schema_history_updated_at
  BEFORE UPDATE ON schema_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to compute revenue forecasts
CREATE OR REPLACE FUNCTION compute_revenue_forecast(
  p_contract_extraction_id UUID,
  p_forecast_months INTEGER DEFAULT 12
) RETURNS VOID AS $$
DECLARE
  revenue_term RECORD;
  forecast_month DATE;
  monthly_revenue DECIMAL;
  current_month INTEGER;
  ramp_factor FLOAT;
BEGIN
  -- Clear existing forecasts for this contract
  DELETE FROM revenue_forecasts WHERE contract_extraction_id = p_contract_extraction_id;
  
  -- Loop through each revenue term for this contract
  FOR revenue_term IN 
    SELECT * FROM revenue_terms 
    WHERE contract_extraction_id = p_contract_extraction_id 
  LOOP
    -- Generate forecasts for each month
    FOR current_month IN 1..p_forecast_months LOOP
      forecast_month := date_trunc('month', revenue_term.start_date) + 
                       INTERVAL '1 month' * (current_month - 1);
      
      -- Skip if forecast month is after contract end date
      IF revenue_term.end_date IS NOT NULL AND forecast_month > revenue_term.end_date THEN
        CONTINUE;
      END IF;
      
      -- Calculate base monthly revenue
      CASE revenue_term.billing_frequency
        WHEN 'monthly' THEN 
          monthly_revenue := revenue_term.quantity * revenue_term.unit_price;
        WHEN 'quarterly' THEN 
          monthly_revenue := (revenue_term.quantity * revenue_term.unit_price) / 3;
        WHEN 'annually' THEN 
          monthly_revenue := (revenue_term.quantity * revenue_term.unit_price) / 12;
        ELSE 
          monthly_revenue := 0;
      END CASE;
      
      -- Apply ramp factor if exists
      ramp_factor := 1.0;
      IF revenue_term.ramp_schedule IS NOT NULL THEN
        ramp_factor := COALESCE(
          (revenue_term.ramp_schedule->('month_' || current_month))::FLOAT, 
          1.0
        );
      END IF;
      
      monthly_revenue := monthly_revenue * ramp_factor;
      
      -- Apply escalation rate
      IF revenue_term.escalation_rate > 0 THEN
        monthly_revenue := monthly_revenue * POWER(1 + revenue_term.escalation_rate, 
                          EXTRACT(YEAR FROM forecast_month) - EXTRACT(YEAR FROM revenue_term.start_date));
      END IF;
      
      -- Insert forecast record
      INSERT INTO revenue_forecasts (
        contract_extraction_id,
        user_id,
        forecast_month,
        projected_revenue,
        arr,
        acv
      ) VALUES (
        p_contract_extraction_id,
        revenue_term.user_id,
        forecast_month,
        monthly_revenue,
        monthly_revenue * 12, -- Simple ARR calculation
        revenue_term.quantity * revenue_term.unit_price -- ACV
      );
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;