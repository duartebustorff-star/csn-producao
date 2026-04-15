# PONTO DE SITUAÇÃO — Chat 14 Abril 2026 (pré-S51)
## HEAD: 5b5a721

---

## COMMITS REALIZADOS

| Hash | Descrição |
|------|-----------|
| `0ad10fd` | feat: skill design portal + PropostaWizard + APIs matrícula e proposta |
| `7c3a638` | feat: portal 4 botões (Produção, Registo Veículo, Encomendas, Área Pessoal) + API parque + RegistoVeiculoView + EncomendasView |
| `f0a2c1d` | fix: raiz redireciona para /portal (REVERTIDO) |
| `56a0f6f` | revert: restaurar pagina principal original |
| `2cb3270` | fix: dedup ATCUD Agente Documental + coluna anexos_erro |
| `5b5a721` | docs: convenção nomes Inventor iLogic - prefixos parâmetros + PAR/STD + assemblies |

---

## MIGRATIONS SUPABASE

| Migration | Tabelas |
|-----------|---------|
| create_movimentos_parque | `movimentos_parque` (entrada/saída viaturas) |
| create_facturas_eni | `facturas_eni` + `facturas_eni_linhas` |
| create_catalogo_materiais_ferromar | `catalogo_materiais_ferromar` + `cotacoes_ferromar` + `cotacoes_ferromar_linhas` |
| create_facturas_ferromar | `facturas_ferromar` + `facturas_ferromar_linhas` |
| alter_tickets_anexos_erro | coluna `anexos_erro TEXT` em `tickets` |

---

## DADOS INSERIDOS

### Obras Standard (7 obras, 21 fases)
- STD-PRD (8 fases: bases, travessas, longarinas, laterais, frontais, taipais, cofres, suportes)
- STD-MNT-BODOR (4 fases: tabuleiros, resíduos, varrer debaixo, perímetro)
- STD-MNT-POLIR (3 fases: disco/protecções, verificar, zona envolvente)
- STD-LMP-LASER (1 fase)
- STD-LMP-MONTAGEM (1 fase)
- STD-LMP-PINTURA (1 fase)
- STD-ORG-RESIDUOS (3 fases: ecopontos, juntar, exterior)
- MNT-001 a 004 antigos → estado `concluida`

### Parque
- ISUZU N35.150 NLR registado lugar 1 (VIN: JAANLR88HR7100651, expedidor IMOTORS LDA)
- Lugares 10-15 libertados (JAP entregues)

### ENI Plenitude (fornecedor id=22)
- 29 facturas migradas do e-Fatura para `facturas_eni`
- 5 PDFs processados pelo Agente Documental com extracção completa de linhas kWh
- Categoria `energia_gas` / `L2-SUP` classificada
- NC A25PT/00002441 + FT F25PT/00026530 marcadas como `anulado`

### Ferromar (fornecedor id=38)
- Dados actualizados: email, telefone, morada, categoria `aço_tubos_chapa`
- Catálogo: 9 materiais com preço €/kg e flag stock
- Cotação 4Q0095476 (Abr 2026): €979,29 — 4 linhas
- Factura 4FR/26000042 (Jan 2026): €1.420,56 — 5 linhas com peso kg
- Comparação: Jan com 25-26% desconto vs Abr sem desconto (+4-5%)
- Tubo 120×60×2 SEM STOCK — alternativa 3mm

### Variáveis iLogic
- H_taipal corrigido: 400 → 450mm (madeira standard)
- H_piso corrigido: 40 → 200mm (bases universais + longarina + travessas)
- Fórmula X_pos corrigida: `WB - ADAP01 - GAP`
- ADAP01 definição: traseiro cabina → eixo dianteiro (PENDENTE validação BBG)

---

## DOCUMENTOS PRODUZIDOS

| Documento | Localização |
|-----------|-------------|
| CSN-Convencao-Nomes-Inventor.md | `docs/` (commitado) |
| SKILL-CSN-PORTAL-DESIGN.md | `skills/csn/` (commitado S13-Abr) |
| parque-movimento-route.ts | `src/app/api/parque/movimento/route.ts` (commitado) |
| PONTO-SITUACAO-CHAT-14ABR2026.md | Este ficheiro |

---

## PORTAL — ESTADO ACTUAL

**URL:** `csn-producao.vercel.app`
- `/` → Lista de nomes (Bohdan, Duarte, João António, José Julio) → ModeSelector 4 botões
- `/portal` → Login PIN → Dashboard produção (v3 do Claude Code)

**4 botões no ModeSelector:**
1. Produção (laranja) — obras, fases, timer
2. Registo de Veículo (verde) — carroçaria nova / reparação / entrada-saída
3. Encomendas (azul) — placeholder
4. Área Pessoal (cinza) — recibos, férias, dados

**PINs:** Bohdan 1001, José Julio 1002, João António 1003, Duarte 1234

---

## PIPELINE EMAIL — ESTADO

- 182 tickets última semana, Router operacional
- Agente Documental: fix dedup ATCUD, batch size 1 evita timeout
- Hoje: 10 emails reais processados

### Tickets abertos relevantes:
- **BZ-93-LE** — termo responsabilidade urgente (2º pedido, juliana.sousa@caasolution.pt)
- **Ford BBAS Q-381** — boletim bomba combustível série E (manter aberto)
- **Via Verde** — pagamento pendente
- **ENI Plenitude** — dívida €1.456,06

---

## PENDENTE PARA S51

### Urgente
- [ ] Termo responsabilidade BZ-93-LE (2º pedido)
- [ ] Testar portal com trabalhadores (PIN 1001/1002/1003)
- [ ] Email Ferromar: pedir tubo 100×60×2 + condições desconto 25%
- [ ] Foto VIN ISUZU N35.150 ao colaborador

### Portal
- [ ] Unificar `/` e `/portal` (decisão: melhorar o `/` com as funcionalidades do `/portal`)
- [ ] Botão Logística funcional (entrada/saída viatura com fotos)
- [ ] Testar PropostaWizard end-to-end
- [ ] Rota `/api/upload` para fotos

### Engenharia
- [ ] Validar ADAP01 com BBG Renault (definição exacta)
- [ ] Commitar VARIAVEIS-ILOGIC-INVENTOR.md e VARIAVEIS-ILOGIC-78-ESTADO.md
- [ ] Extrair BBG FUSO (27 chassis, PDF existe)

### Sistema
- [ ] 4 docs fecho S49
- [ ] Obras JAP por facturar
- [ ] Power Automate off
- [ ] Fix double-encoding JSON
- [ ] COC Eletrónico IMT (deadline Jul 2026)

### Fornecedores
- [ ] Processar 3 facturas Ferromar 2023 (precisa PDFs)
- [ ] Processar facturas ENI antigas (27 sem PDF — descarregar do portal)
- [ ] Procurar fornecedor alternativo tubo 120×60×2
