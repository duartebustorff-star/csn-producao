#!/usr/bin/env python3
"""
CSN Produção — Gerador de PDFs para Auditoria ISO 9001:2015
Gera documentos PDF a partir dos dados no Supabase.

Utilização:
  python gerar_pdfs_auditoria.py --tipo todos --output ./pdfs_auditoria/
  python gerar_pdfs_auditoria.py --tipo nao_conformidades
  python gerar_pdfs_auditoria.py --tipo pacote_auditoria  # ZIP com tudo

Tipos disponíveis:
  nao_conformidades   - Lista de NCs e ações corretivas
  auditorias          - Relatórios de auditorias internas
  revisao_gestao      - Atas de revisão pela gestão
  equipamentos        - Lista de equipamentos + calibrações
  fornecedores        - Lista de fornecedores aprovados
  reclamacoes         - Registo de reclamações
  formacoes           - Registos de formação
  todos               - Gera todos os PDFs
  pacote_auditoria    - Gera ZIP com tudo pronto para o auditor
"""

import json
import os
import sys
import zipfile
from datetime import datetime, date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


# ============================================
# CONFIGURAÇÃO
# ============================================

EMPRESA = "Carlos dos Santos Nascimento, Lda"
MORADA = "Portugal"  # Atualizar com morada real
CERTIFICACAO = "ISO 9001:2015 — TÜV Rheinland"
EQUIPA = ["Duarte (Gestor)", "Bohdan (Operador)", "João António (Operador)", "José Julio (Operador)"]

# Cores da app CSN
COR_HEADER = colors.HexColor("#0c1220")
COR_ACCENT = colors.HexColor("#e8930b")
COR_CINZA = colors.HexColor("#f5f5f5")


# ============================================
# ESTILOS
# ============================================

def get_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='DocTitle',
        parent=styles['Title'],
        fontSize=18,
        textColor=COR_HEADER,
        spaceAfter=6*mm,
    ))
    styles.add(ParagraphStyle(
        name='DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=4*mm,
    ))
    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=COR_HEADER,
        spaceBefore=6*mm,
        spaceAfter=3*mm,
    ))
    styles.add(ParagraphStyle(
        name='FieldLabel',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey,
    ))
    styles.add(ParagraphStyle(
        name='FieldValue',
        parent=styles['Normal'],
        fontSize=10,
        spaceBefore=1*mm,
        spaceAfter=3*mm,
    ))
    return styles


# ============================================
# CABEÇALHO E RODAPÉ
# ============================================

def header_footer(canvas_obj, doc):
    canvas_obj.saveState()
    w, h = A4

    # Header
    canvas_obj.setFillColor(COR_HEADER)
    canvas_obj.rect(0, h - 20*mm, w, 20*mm, fill=1)
    canvas_obj.setFillColor(colors.white)
    canvas_obj.setFont("Helvetica-Bold", 10)
    canvas_obj.drawString(15*mm, h - 13*mm, EMPRESA)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.drawString(15*mm, h - 17*mm, CERTIFICACAO)

    # Linha accent
    canvas_obj.setStrokeColor(COR_ACCENT)
    canvas_obj.setLineWidth(2)
    canvas_obj.line(0, h - 20*mm, w, h - 20*mm)

    # Footer
    canvas_obj.setFillColor(colors.grey)
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.drawString(15*mm, 10*mm,
        f"Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')} — CSN Produção — SGQ ISO 9001:2015")
    canvas_obj.drawRightString(w - 15*mm, 10*mm, f"Página {doc.page}")

    canvas_obj.restoreState()


def build_pdf(filename, story, title=""):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        topMargin=28*mm,
        bottomMargin=20*mm,
        leftMargin=15*mm,
        rightMargin=15*mm,
    )
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"  ✓ {filename}")


# ============================================
# GERADORES DE PDF — DADOS DE EXEMPLO
# (Em produção, estes dados vêm do Supabase)
# ============================================

def gerar_nao_conformidades(output_dir, dados=None):
    """Gera PDF com lista de não-conformidades e ações corretivas."""
    styles = get_styles()
    story = []

    story.append(Paragraph("Registo de Não-Conformidades", styles['DocTitle']))
    story.append(Paragraph("ISO 9001:2015 — Cláusula 10.2", styles['DocSubtitle']))
    story.append(HRFlowable(width="100%", color=COR_ACCENT, thickness=1))
    story.append(Spacer(1, 5*mm))

    if not dados:
        story.append(Paragraph("Sem não-conformidades registadas.", styles['Normal']))
        story.append(Spacer(1, 5*mm))
        story.append(Paragraph(
            "Nota: Este registo confirma que o sistema de gestão de não-conformidades "
            "está implementado e operacional. As NCs são registadas no sistema CSN Produção "
            "e exportadas para este documento quando solicitado.",
            styles['FieldValue']))
    else:
        for nc in dados:
            story.append(Paragraph(f"NC: {nc.get('codigo', 'N/A')}", styles['SectionTitle']))

            campos = [
                ("Data de Deteção", nc.get('data_detecao', '')),
                ("Origem", nc.get('origem', '')),
                ("Descrição", nc.get('descricao', '')),
                ("Obra Afetada", nc.get('obra_id', 'N/A')),
                ("Ação Imediata", nc.get('acao_imediata', '')),
                ("Causa Raiz", nc.get('causa_raiz', '')),
                ("Ação Corretiva", nc.get('acao_corretiva', '')),
                ("Responsável", nc.get('responsavel', '')),
                ("Prazo", nc.get('prazo', '')),
                ("Eficaz?", "Sim" if nc.get('eficaz') else "Não" if nc.get('eficaz') is False else "Pendente"),
                ("Verificado por", nc.get('verificado_por', '')),
                ("Estado", nc.get('estado', '')),
            ]
            for label, valor in campos:
                story.append(Paragraph(label, styles['FieldLabel']))
                story.append(Paragraph(str(valor) if valor else "—", styles['FieldValue']))

            story.append(HRFlowable(width="80%", color=colors.lightgrey, thickness=0.5))
            story.append(Spacer(1, 3*mm))

    filepath = os.path.join(output_dir, "NC_Nao_Conformidades.pdf")
    build_pdf(filepath, story)
    return filepath


def gerar_auditorias(output_dir, dados=None):
    """Gera PDF com relatórios de auditorias internas."""
    styles = get_styles()
    story = []

    story.append(Paragraph("Auditorias Internas", styles['DocTitle']))
    story.append(Paragraph("ISO 9001:2015 — Cláusula 9.2", styles['DocSubtitle']))
    story.append(HRFlowable(width="100%", color=COR_ACCENT, thickness=1))
    story.append(Spacer(1, 5*mm))

    if not dados:
        story.append(Paragraph("Sem auditorias internas registadas.", styles['Normal']))
        story.append(Spacer(1, 5*mm))
        story.append(Paragraph(
            "Nota: O programa de auditorias internas está implementado no sistema CSN Produção. "
            "As auditorias são planeadas anualmente cobrindo todos os processos do SGQ.",
            styles['FieldValue']))
    else:
        for audit in dados:
            story.append(Paragraph(f"Auditoria: {audit.get('codigo', 'N/A')}", styles['SectionTitle']))
            campos = [
                ("Data", audit.get('data_auditoria', '')),
                ("Auditor", audit.get('auditor', '')),
                ("Processos Auditados", ', '.join(audit.get('processos_auditados', []))),
                ("Conformidades", audit.get('conformidades', '')),
                ("Não-Conformidades", audit.get('nao_conformidades_encontradas', '')),
                ("Observações", audit.get('observacoes', '')),
                ("Conclusão", audit.get('conclusao', '')),
            ]
            for label, valor in campos:
                story.append(Paragraph(label, styles['FieldLabel']))
                story.append(Paragraph(str(valor) if valor else "—", styles['FieldValue']))
            story.append(HRFlowable(width="80%", color=colors.lightgrey, thickness=0.5))

    filepath = os.path.join(output_dir, "AI_Auditorias_Internas.pdf")
    build_pdf(filepath, story)
    return filepath


def gerar_revisao_gestao(output_dir, dados=None):
    """Gera PDF com atas de revisão pela gestão."""
    styles = get_styles()
    story = []

    story.append(Paragraph("Revisão pela Gestão", styles['DocTitle']))
    story.append(Paragraph("ISO 9001:2015 — Cláusula 9.3", styles['DocSubtitle']))
    story.append(HRFlowable(width="100%", color=COR_ACCENT, thickness=1))
    story.append(Spacer(1, 5*mm))

    if not dados:
        story.append(Paragraph("Sem revisões pela gestão registadas.", styles['Normal']))
    else:
        for rev in dados:
            story.append(Paragraph(f"Revisão: {rev.get('codigo', 'N/A')}", styles['SectionTitle']))
            campos = [
                ("Data", rev.get('data_revisao', '')),
                ("Participantes", ', '.join(rev.get('participantes', []))),
                ("Estado Ações Anteriores", rev.get('estado_acoes_anteriores', '')),
                ("Alterações de Contexto", rev.get('alteracoes_contexto', '')),
                ("Desempenho da Qualidade", rev.get('desempenho_qualidade', '')),
                ("Resultados de Auditorias", rev.get('resultados_auditorias', '')),
                ("Satisfação de Clientes", rev.get('satisfacao_clientes', '')),
                ("Riscos e Oportunidades", rev.get('riscos_oportunidades', '')),
                ("Decisões", rev.get('decisoes', '')),
                ("Recursos Necessários", rev.get('recursos_necessarios', '')),
                ("Ações de Melhoria", rev.get('acoes_melhoria', '')),
            ]
            for label, valor in campos:
                story.append(Paragraph(label, styles['FieldLabel']))
                story.append(Paragraph(str(valor) if valor else "—", styles['FieldValue']))
            story.append(HRFlowable(width="80%", color=colors.lightgrey, thickness=0.5))

    filepath = os.path.join(output_dir, "RG_Revisao_Gestao.pdf")
    build_pdf(filepath, story)
    return filepath


def gerar_equipamentos(output_dir, dados=None):
    """Gera PDF com lista de equipamentos e calibrações."""
    styles = get_styles()
    story = []

    story.append(Paragraph("Equipamentos e Calibração", styles['DocTitle']))
    story.append(Paragraph("ISO 9001:2015 — Cláusula 7.1.5", styles['DocSubtitle']))
    story.append(HRFlowable(width="100%", color=COR_ACCENT, thickness=1))
    story.append(Spacer(1, 5*mm))

    if not dados:
        story.append(Paragraph("Sem equipamentos registados.", styles['Normal']))
    else:
        # Tabela resumo
        header = ['Código', 'Nome', 'Tipo', 'Calibração', 'Próx. Manutenção']
        table_data = [header]
        for eq in dados:
            table_data.append([
                eq.get('codigo', ''),
                eq.get('nome', ''),
                eq.get('tipo', ''),
                eq.get('proxima_calibracao', 'N/A') if eq.get('requer_calibracao') else 'N/A',
                eq.get('proxima_manutencao', '—'),
            ])

        t = Table(table_data, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COR_HEADER),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COR_CINZA]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t)

    filepath = os.path.join(output_dir, "EQ_Equipamentos_Calibracao.pdf")
    build_pdf(filepath, story)
    return filepath


def gerar_fornecedores(output_dir, dados=None):
    """Gera PDF com lista de fornecedores aprovados."""
    styles = get_styles()
    story = []

    story.append(Paragraph("Fornecedores Aprovados", styles['DocTitle']))
    story.append(Paragraph("ISO 9001:2015 — Cláusula 8.4", styles['DocSubtitle']))
    story.append(HRFlowable(width="100%", color=COR_ACCENT, thickness=1))
    story.append(Spacer(1, 5*mm))

    if not dados:
        story.append(Paragraph("Sem fornecedores registados.", styles['Normal']))
    else:
        header = ['Nome', 'Fornecimento', 'Qualidade', 'Prazo', 'Aprovado', 'Última Avaliação']
        table_data = [header]
        for f in dados:
            nq = f.get('nota_qualidade', '')
            np_ = f.get('nota_prazo', '')
            table_data.append([
                f.get('nome', ''),
                f.get('tipo_fornecimento', ''),
                f"{nq}/5" if nq else '—',
                f"{np_}/5" if np_ else '—',
                'Sim' if f.get('aprovado') else 'Não',
                f.get('ultima_avaliacao', '—'),
            ])

        t = Table(table_data, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COR_HEADER),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COR_CINZA]),
        ]))
        story.append(t)

    filepath = os.path.join(output_dir, "FN_Fornecedores_Aprovados.pdf")
    build_pdf(filepath, story)
    return filepath


def gerar_reclamacoes(output_dir, dados=None):
    """Gera PDF com registo de reclamações de clientes."""
    styles = get_styles()
    story = []

    story.append(Paragraph("Reclamações de Clientes", styles['DocTitle']))
    story.append(Paragraph("ISO 9001:2015 — Cláusula 9.1.2", styles['DocSubtitle']))
    story.append(HRFlowable(width="100%", color=COR_ACCENT, thickness=1))
    story.append(Spacer(1, 5*mm))

    if not dados:
        story.append(Paragraph("Sem reclamações registadas.", styles['Normal']))
        story.append(Spacer(1, 5*mm))
        story.append(Paragraph(
            "Nota: A ausência de reclamações é monitorizada. O sistema está operacional "
            "para registo e tratamento de reclamações quando ocorram.",
            styles['FieldValue']))
    else:
        for rc in dados:
            story.append(Paragraph(f"Reclamação: {rc.get('codigo', 'N/A')}", styles['SectionTitle']))
            campos = [
                ("Data", rc.get('data_recepcao', '')),
                ("Cliente", rc.get('cliente', '')),
                ("Obra", rc.get('obra_id', 'N/A')),
                ("Descrição", rc.get('descricao', '')),
                ("Resposta", rc.get('resposta', '')),
                ("Responsável", rc.get('responsavel', '')),
                ("Data Resolução", rc.get('data_resolucao', '')),
                ("Estado", rc.get('estado', '')),
                ("Cliente Satisfeito?", "Sim" if rc.get('cliente_satisfeito') else "Pendente"),
            ]
            for label, valor in campos:
                story.append(Paragraph(label, styles['FieldLabel']))
                story.append(Paragraph(str(valor) if valor else "—", styles['FieldValue']))
            story.append(HRFlowable(width="80%", color=colors.lightgrey, thickness=0.5))

    filepath = os.path.join(output_dir, "RC_Reclamacoes_Clientes.pdf")
    build_pdf(filepath, story)
    return filepath


def gerar_formacoes(output_dir, dados=None):
    """Gera PDF com registos de formação."""
    styles = get_styles()
    story = []

    story.append(Paragraph("Registos de Formação", styles['DocTitle']))
    story.append(Paragraph("ISO 9001:2015 — Cláusula 7.2", styles['DocSubtitle']))
    story.append(HRFlowable(width="100%", color=COR_ACCENT, thickness=1))
    story.append(Spacer(1, 5*mm))

    if not dados:
        story.append(Paragraph("Sem formações registadas.", styles['Normal']))
    else:
        header = ['Colaborador', 'Formação', 'Tipo', 'Data', 'Horas', 'Formador']
        table_data = [header]
        for f in dados:
            table_data.append([
                f.get('colaborador_nome', ''),
                f.get('descricao', ''),
                f.get('tipo', ''),
                f.get('data_formacao', ''),
                str(f.get('duracao_horas', '')) + 'h' if f.get('duracao_horas') else '—',
                f.get('formador', '—'),
            ])

        t = Table(table_data, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COR_HEADER),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COR_CINZA]),
        ]))
        story.append(t)

    filepath = os.path.join(output_dir, "FM_Formacoes.pdf")
    build_pdf(filepath, story)
    return filepath


# ============================================
# PACOTE DE AUDITORIA
# ============================================

def gerar_pacote_auditoria(output_dir):
    """Gera todos os PDFs e empacota num ZIP."""
    print("\n📦 A gerar pacote de auditoria ISO 9001:2015...\n")

    ficheiros = []
    ficheiros.append(gerar_nao_conformidades(output_dir))
    ficheiros.append(gerar_auditorias(output_dir))
    ficheiros.append(gerar_revisao_gestao(output_dir))
    ficheiros.append(gerar_equipamentos(output_dir))
    ficheiros.append(gerar_fornecedores(output_dir))
    ficheiros.append(gerar_reclamacoes(output_dir))
    ficheiros.append(gerar_formacoes(output_dir))

    # Criar ZIP
    data_str = datetime.now().strftime('%Y%m%d')
    zip_path = os.path.join(output_dir, f"Pacote_Auditoria_ISO9001_{data_str}.zip")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for f in ficheiros:
            zf.write(f, os.path.basename(f))

    print(f"\n✅ Pacote de auditoria criado: {zip_path}")
    print(f"   {len(ficheiros)} documentos | {os.path.getsize(zip_path) / 1024:.0f} KB")
    return zip_path


# ============================================
# MAIN
# ============================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Gerador de PDFs ISO 9001:2015 — CSN Produção")
    parser.add_argument("--tipo", default="todos",
        choices=["nao_conformidades", "auditorias", "revisao_gestao",
                 "equipamentos", "fornecedores", "reclamacoes", "formacoes",
                 "todos", "pacote_auditoria"],
        help="Tipo de documento a gerar")
    parser.add_argument("--output", default="./pdfs_auditoria",
        help="Pasta de destino")
    parser.add_argument("--dados", default=None,
        help="Ficheiro JSON com dados do Supabase (opcional)")

    args = parser.parse_args()

    # Criar pasta de output
    os.makedirs(args.output, exist_ok=True)

    # Carregar dados se fornecidos
    dados = None
    if args.dados and os.path.exists(args.dados):
        with open(args.dados) as f:
            dados = json.load(f)

    geradores = {
        "nao_conformidades": gerar_nao_conformidades,
        "auditorias": gerar_auditorias,
        "revisao_gestao": gerar_revisao_gestao,
        "equipamentos": gerar_equipamentos,
        "fornecedores": gerar_fornecedores,
        "reclamacoes": gerar_reclamacoes,
        "formacoes": gerar_formacoes,
    }

    if args.tipo == "pacote_auditoria":
        gerar_pacote_auditoria(args.output)
    elif args.tipo == "todos":
        print("\n📄 A gerar todos os PDFs ISO 9001:2015...\n")
        for nome, func in geradores.items():
            func(args.output, dados.get(nome) if dados else None)
        print("\n✅ Todos os documentos gerados.")
    else:
        func = geradores[args.tipo]
        func(args.output, dados.get(args.tipo) if dados else None)
