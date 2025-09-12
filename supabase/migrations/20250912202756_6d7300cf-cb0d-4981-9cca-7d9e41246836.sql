-- Adiciona tipo 'report' para comentários de relatório gerados automaticamente
-- O tipo 'report' será usado para comentários do sistema que contêm arquivos de relatório

-- Como o campo 'type' é uma string simples, não precisamos modificar a estrutura da tabela
-- Apenas garantir que o tipo 'report' seja aceito

-- Adicionar uma verificação opcional para validar os tipos se desejarmos no futuro
-- ALTER TABLE comentarios_projeto ADD CONSTRAINT check_comment_type 
-- CHECK (type IN ('text', 'audio', 'report'));