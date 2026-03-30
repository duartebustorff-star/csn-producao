# SKILL_QUALIFICACOES — Qualificacoes e Certificacoes do Colaborador
### Codigo: CSN-L3-QMS-SKL-001-2026
### Agente: Agente Qualidade (CSN-L3-QMS-AGT)
### Persona: Fernando
### Sessao: 30

---

## Objectivo

Gerir e consultar qualificacoes de producao dos colaboradores: certificados de soldadura (EN 9606), habilitacoes por equipamento, e fases autorizadas. Dominio L0-PER — perfil de producao, separado do perfil RH (L3-RH).

## Trigger

- Fernando: "O [nome] pode soldar?" / "Quem esta qualificado para o Bodor?"
- Admin: "Certificados a expirar" / "Adicionar qualificacao ao [nome]"
- Automatico: alerta 30 dias antes de expiracao de certificado

## Tabela: qualificacoes (migration 019)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | bigint PK | - |
| colaborador_rh_id | FK → colaboradores_rh | Colaborador |
| tipo | text | 'soldadura_en9606', 'equipamento', 'fase', 'formacao' |
| descricao | text | Ex: "MAG 135, posicao PA/PB, espessura 3-12mm" |
| norma | text | Ex: "EN ISO 9606-1" |
| certificado_numero | text | Numero do certificado |
| emitido_por | text | Entidade certificadora |
| data_emissao | date | - |
| data_validade | date | 2 anos para EN 9606 |
| activa | boolean | default true |
| created_at | timestamptz | - |

## Fluxo — Consulta (colaborador via portal)

1. Autenticar com PIN
2. `SELECT * FROM qualificacoes WHERE colaborador_rh_id = $1 AND activa = true ORDER BY tipo, data_validade`
3. Agrupar por tipo: Soldadura | Equipamento | Fases | Formacao
4. Alertas visuais: certificados a expirar em < 30 dias (amarelo) ou expirados (vermelho)

## Fluxo — Consulta (admin/Fernando)

1. Listar todos os colaboradores com resumo de qualificacoes
2. Filtrar por tipo ou por equipamento
3. "Quem pode operar o Bodor?" → `SELECT c.nome_completo FROM colaboradores_rh c JOIN qualificacoes q ON q.colaborador_rh_id = c.id WHERE q.tipo = 'equipamento' AND q.descricao ILIKE '%bodor%' AND q.activa = true`

## Fluxo — Alerta automatico

1. Diariamente (futuro cron): verificar qualificacoes com data_validade <= NOW() + 30 dias
2. Gerar notificacao para admin
3. Qualificacoes expiradas: marcar activa = false automaticamente

## Tipos de qualificacao

### soldadura_en9606
- Processo: MAG (135), MIG (131), TIG (141)
- Posicao: PA, PB, PC, PD, PE, PF
- Espessura: range mm
- Validade: 2 anos
- Renovacao: prolongamento semestral com evidencia de actividade

### equipamento
- Bodor laser, Weinig Unimat 22E, ponte rolante, empilhador, KUKA (futuro)
- Requer formacao especifica + certificado operador

### fase
- Fases habilitadas: F1-corte, F2-quinagem, F3-soldadura, etc.
- Sem validade (permanente apos formacao)

### formacao
- Formacoes internas e externas
- Seguranca, primeiros socorros, trabalho em altura, etc.

## Regras

- Colaborador sem qualificacao activa de soldadura NAO pode ser assignado a fases de soldadura (futuro: validacao no SKILL_PONTO)
- EN 9606 requer renovacao a cada 2 anos — sistema deve alertar
- Dados L0-PER sao independentes de L3-RH — um colaborador pode ter perfil RH sem perfil producao e vice-versa

## Tabelas

- `qualificacoes` — leitura/escrita
- `colaboradores_rh` — leitura (join para nome)

## Nivel ISA-95

L0-PER (Personnel Model — Production Qualifications)
Agente opera em L3-QMS mas os dados pertencem a L0-PER
