-- Add new date columns for implantation start and end dates
ALTER TABLE public.projetos 
ADD COLUMN data_inicio_implantacao DATE,
ADD COLUMN data_fim_implantacao DATE;

-- Migrate existing data_agendada to data_inicio_implantacao (assuming start date equals the scheduled date)
UPDATE public.projetos 
SET data_inicio_implantacao = data_agendada, 
    data_fim_implantacao = data_agendada;

-- Now make the new columns NOT NULL since they should always have values
ALTER TABLE public.projetos 
ALTER COLUMN data_inicio_implantacao SET NOT NULL,
ALTER COLUMN data_fim_implantacao SET NOT NULL;

-- Keep data_agendada for backward compatibility but make it optional
ALTER TABLE public.projetos 
ALTER COLUMN data_agendada DROP NOT NULL;