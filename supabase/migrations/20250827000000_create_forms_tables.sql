-- Create enums for forms
CREATE TYPE form_type AS ENUM ('template', 'intake');
CREATE TYPE form_status AS ENUM ('draft', 'published');

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo TEXT,
  createdby TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE services (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  form_id UUID NULL,
  name TEXT NOT NULL,

  -- Enforce same-tenant relationship (and allow NULL form_id)
  FOREIGN KEY (workspace_id, form_id)
    REFERENCES forms (workspace_id, id)
    ON DELETE SET NULL
);

-- Create forms table
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type form_type NOT NULL,
    title TEXT NOT NULL,

    workspace_id UUID NOT NULL,
    
    status form_status NOT NULL DEFAULT 'draft',
    accepting_submissions BOOLEAN NOT NULL DEFAULT true,
    share_uri TEXT UNIQUE,
    has_been_submitted BOOLEAN NOT NULL DEFAULT false,
    
    thumbnail_url TEXT,
    cover_url TEXT,
    description TEXT,

    published_at TIMESTAMP WITH TIME ZONE,
    location_tags JSONB,
    account_tags JSONB,
    last_saved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    
    -- Note: Unique constraint on (service_id, kind) removed since service_id can be NULL
    -- Business logic should enforce one template and one intake per service when service_id is not NULL
);

-- Create form_fields table
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    type TEXT NOT NULL,
    label TEXT,
    required BOOLEAN NOT NULL DEFAULT false,
    config JSON NOT NULL DEFAULT '{}',
    
    -- Unique constraints
    UNIQUE(form_id, position),
);

-- Create indexes for better performance
CREATE INDEX idx_services_workspace_id ON services(workspace_id);
CREATE INDEX idx_forms_service_id ON forms(service_id);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_forms_kind ON forms(kind);
CREATE INDEX idx_forms_share_uri ON forms(share_uri);
CREATE INDEX idx_forms_deleted_at ON forms(deleted_at);
CREATE INDEX idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX idx_form_fields_position ON form_fields(form_id, position);

-- Partial unique index to ensure one template and one intake per service (when service_id is not NULL)
CREATE UNIQUE INDEX idx_forms_service_kind_unique 
    ON forms(service_id, kind) 
    WHERE service_id IS NOT NULL;

-- Add updated_at trigger for forms table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_updated_at 
    BEFORE UPDATE ON forms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE services IS 'Services that can have forms associated with them';
COMMENT ON TABLE forms IS 'Forms that can be either templates or intake forms for services';
COMMENT ON TABLE form_fields IS 'Individual fields within forms with their configuration';

COMMENT ON COLUMN forms.kind IS 'Type of form: template or intake';
COMMENT ON COLUMN forms.status IS 'Current status of the form';
COMMENT ON COLUMN forms.location_tags IS 'JSON array of location tags like ["NYC","Queens"]';
COMMENT ON COLUMN forms.account_tags IS 'JSON array of account-related tags';
COMMENT ON COLUMN form_fields.config IS 'JSON configuration object for field-specific settings';
COMMENT ON COLUMN form_fields.position IS 'Order position of field within the form';

CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  form_id UUID NOT NULL,
  form_version INT NOT NULL DEFAULT 1,
  answers JSONB NOT NULL,                       -- [{ "fieldKey":"email", "fieldId":"...", "type":"email", "value":"a@b.com" }, ...]
  schema_snapshot JSONB NOT NULL,               -- copy of fields (keys, types, rules) at submission time
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (workspace_id, form_id) REFERENCES forms(workspace_id, id) ON DELETE CASCADE,
  CHECK (jsonb_typeof(answers) = 'array')
);