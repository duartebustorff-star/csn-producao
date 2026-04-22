' =====================================================================
' CSN_Export_Nesting_v2.vb
' =====================================================================
' Rule iLogic para Autodesk Inventor 2026+
'
' Propósito:
'   Exportar peças do assembly activo para:
'     - CHAPAS → DXF flat pattern (Sheet Metal)
'     - TUBOS  → STEP AP214
'
' Entrada para o módulo CSN NestHub (ver arquitectura S54).
'
' Autor: CSN Opus (Duarte Bustorff) — S54 · 2026-04-22
' Licença: proprietary — CSN Lda
'
' Estrutura de pastas criada:
'   C:\Users\Utilizador\Projectos-AI\Nesting\
'     └── {asm_name}\
'         ├── Chapas\     ← DXF flat patterns
'         └── Tubos\      ← STEP AP214
'
' Nomenclatura:
'   {nome_original}_{t=Xmm|NxNxN}_{material}_{NNN}.{dxf|step}
'
'   Exemplos:
'     Fecho_07-02_Base_t=3mm_S235JR_001.dxf
'     Stringer_Front_80x40x3_S235JR_012.step
'
' Fonte de material:
'   1. partDef.Material.Name (iProperty)
'   2. Regex no nome (ex: "_S275_" → S275)
'   3. Fallback: "MISSING"
'
' Resultado teste S54 (Main Assembly-version-4_2.iam):
'   8 DXF + 60 STEP criados
'   18 skipped (sem flat pattern — 3 peças problemáticas)
'   26 campos MISSING (iProperty material vazio)
' =====================================================================

Imports System
Imports System.IO
Imports System.Text.RegularExpressions
Imports Inventor

' Constante — pasta raiz (alterar se necessário)
Const NESTING_ROOT As String = "C:\Users\Utilizador\Projectos-AI\Nesting"

Sub Main()
    Dim oApp As Inventor.Application = ThisApplication
    Dim oDoc As Document = oApp.ActiveDocument

    If oDoc.DocumentType <> DocumentTypeEnum.kAssemblyDocumentObject Then
        MessageBox.Show("Abra um assembly (.iam) antes de correr esta rule.", "CSN Export Nesting")
        Exit Sub
    End If

    Dim oAsm As AssemblyDocument = CType(oDoc, AssemblyDocument)
    Dim oAsmDef As AssemblyComponentDefinition = oAsm.ComponentDefinition
    Dim asmName As String = Path.GetFileNameWithoutExtension(oDoc.FullFileName)

    ' Criar pastas
    Dim rootPath As String = Path.Combine(NESTING_ROOT, asmName)
    Dim chapasPath As String = Path.Combine(rootPath, "Chapas")
    Dim tubosPath As String = Path.Combine(rootPath, "Tubos")
    Directory.CreateDirectory(chapasPath)
    Directory.CreateDirectory(tubosPath)

    ' Contadores
    Dim dxfCount As Integer = 0
    Dim stepCount As Integer = 0
    Dim skipCount As Integer = 0
    Dim missingMatCount As Integer = 0
    Dim chapaSeq As Integer = 0
    Dim tuboSeq As Integer = 0

    Dim processedParts As New HashSet(Of String) ' evitar exportar a mesma peça 2 vezes

    Try
        ProcessOccurrences(
            oAsmDef.Occurrences,
            chapasPath, tubosPath,
            dxfCount, stepCount, skipCount, missingMatCount,
            chapaSeq, tuboSeq,
            processedParts)

        Dim msg As String = String.Format(
            "CSN Export Nesting concluído:" & vbCrLf & vbCrLf &
            "Pasta raiz: {0}" & vbCrLf & vbCrLf &
            "DXF (chapas): {1}" & vbCrLf &
            "STEP (tubos): {2}" & vbCrLf &
            "Skipped (sem flat pattern): {3}" & vbCrLf &
            "Material MISSING: {4}" & vbCrLf & vbCrLf &
            "Peças únicas processadas: {5}",
            rootPath, dxfCount, stepCount, skipCount, missingMatCount,
            processedParts.Count)

        MessageBox.Show(msg, "CSN Export Nesting")

    Catch ex As Exception
        MessageBox.Show("Erro: " & ex.Message, "CSN Export Nesting — erro")
    End Try
End Sub

Sub ProcessOccurrences(
        occs As ComponentOccurrences,
        chapasPath As String, tubosPath As String,
        ByRef dxfCount As Integer, ByRef stepCount As Integer,
        ByRef skipCount As Integer, ByRef missingMatCount As Integer,
        ByRef chapaSeq As Integer, ByRef tuboSeq As Integer,
        processedParts As HashSet(Of String))

    For Each occ As ComponentOccurrence In occs
        Try
            Dim occDef As ComponentDefinition = occ.Definition

            ' Recursão para sub-assemblies
            If TypeOf occDef Is AssemblyComponentDefinition Then
                Dim subAsmDef As AssemblyComponentDefinition = CType(occDef, AssemblyComponentDefinition)
                ProcessOccurrences(
                    subAsmDef.Occurrences,
                    chapasPath, tubosPath,
                    dxfCount, stepCount, skipCount, missingMatCount,
                    chapaSeq, tuboSeq, processedParts)
                Continue For
            End If

            If Not (TypeOf occDef Is PartComponentDefinition) Then Continue For

            Dim partDef As PartComponentDefinition = CType(occDef, PartComponentDefinition)
            Dim partDoc As PartDocument = CType(partDef.Document, PartDocument)
            Dim partPath As String = partDoc.FullFileName
            Dim partName As String = Path.GetFileNameWithoutExtension(partPath)

            ' Skip se já processada (uniqueness por caminho)
            If processedParts.Contains(partPath) Then Continue For
            processedParts.Add(partPath)

            ' Skip Content Center
            Try
                If occ.Definition.IsContentMember Then Continue For
            Catch
            End Try

            ' Material
            Dim material As String = GetMaterial(partDef, partName, missingMatCount)

            ' Classificar: é SheetMetal?
            Dim docSubType As String = partDoc.SubType.ToLower()
            Dim isSheetMetal As Boolean = docSubType.Contains("sheetmetal") Or
                                          docSubType.Contains("sheet metal") Or
                                          partName.ToLower().Contains("chapa") Or
                                          partName.ToLower().Contains("fecho")

            If isSheetMetal Then
                ' Exportar DXF flat pattern
                Dim smDef As SheetMetalComponentDefinition = TryCast(partDef, SheetMetalComponentDefinition)
                If smDef Is Nothing Then
                    skipCount += 1
                    Continue For
                End If

                ' Thickness
                Dim thickness As String = "tMISSING"
                Try
                    Dim tValue As Double = smDef.Thickness.Value * 10 ' cm → mm
                    thickness = "t=" & tValue.ToString("0.#") & "mm"
                Catch
                End Try

                chapaSeq += 1
                Dim dxfName As String = String.Format("{0}_{1}_{2}_{3:D3}.dxf",
                    SanitizeFileName(partName), thickness, material, chapaSeq)
                Dim dxfPath As String = Path.Combine(chapasPath, dxfName)

                Try
                    ' Gerar flat pattern se não existir
                    If smDef.HasFlatPattern = False Then
                        smDef.Unfold()
                    End If

                    ' Exportar DXF via Data Medium
                    Dim dxfFormat As String = "FLAT PATTERN DXF?AcadVersion=2010&OuterProfileLayer=IV_OUTER_PROFILE"
                    smDef.DataIO.WriteDataToFile(dxfFormat, dxfPath)
                    dxfCount += 1
                Catch
                    skipCount += 1
                End Try
            Else
                ' Exportar STEP (tubo ou outra peça estrutural)
                tuboSeq += 1

                ' Tentar extrair perfil do nome (ex: "80x40x3")
                Dim perfil As String = ExtractProfile(partName)

                Dim stepName As String = String.Format("{0}_{1}_{2}_{3:D3}.step",
                    SanitizeFileName(partName), perfil, material, tuboSeq)
                Dim stepPath As String = Path.Combine(tubosPath, stepName)

                Try
                    Dim oStepTransO As TranslatorAddIn =
                        CType(ThisApplication.ApplicationAddIns.ItemById("{90AF7F40-0C01-11D5-8E83-0010B541CD80}"), TranslatorAddIn)
                    Dim oContext As TranslationContext = ThisApplication.TransientObjects.CreateTranslationContext()
                    oContext.Type = IOMechanismEnum.kFileBrowseIOMechanism
                    Dim oOptions As NameValueMap = ThisApplication.TransientObjects.CreateNameValueMap()
                    Dim oDataMedium As DataMedium = ThisApplication.TransientObjects.CreateDataMedium()

                    oOptions.Value("ApplicationProtocolType") = 3 ' AP214
                    oDataMedium.FileName = stepPath

                    oStepTransO.SaveCopyAs(partDoc, oContext, oOptions, oDataMedium)
                    stepCount += 1
                Catch
                    skipCount += 1
                End Try
            End If

        Catch ex As Exception
            ' Ignorar peças com erro — incrementar skip
            skipCount += 1
        End Try
    Next
End Sub

Function GetMaterial(
        partDef As PartComponentDefinition,
        partName As String,
        ByRef missingMatCount As Integer) As String

    ' 1. iProperty
    Try
        Dim m As String = partDef.Material.Name
        If Not String.IsNullOrWhiteSpace(m) AndAlso m.ToLower() <> "generic" Then
            Return m.Replace(" ", "")
        End If
    Catch
    End Try

    ' 2. Regex no nome (ex: "_S275JR_", "S235")
    Dim matRegex As Regex = New Regex("S(\d{3})(JR|J0|J2|JRG2|MC|N)?", RegexOptions.IgnoreCase)
    Dim match As Match = matRegex.Match(partName)
    If match.Success Then
        Return "S" & match.Groups(1).Value & match.Groups(2).Value.ToUpper()
    End If

    ' 3. Fallback
    missingMatCount += 1
    Return "MISSING"
End Function

Function ExtractProfile(partName As String) As String
    ' Procurar padrão NNNxNNNxNN (ex: 80x40x3) no nome
    Dim pRegex As Regex = New Regex("(\d{2,3})x(\d{1,3})x(\d{1,2})")
    Dim match As Match = pRegex.Match(partName)
    If match.Success Then
        Return match.Groups(1).Value & "x" & match.Groups(2).Value & "x" & match.Groups(3).Value
    End If
    Return "profMISSING"
End Function

Function SanitizeFileName(s As String) As String
    ' Remover caracteres inválidos para nome de ficheiro
    Dim invalid As Char() = Path.GetInvalidFileNameChars()
    For Each c As Char In invalid
        s = s.Replace(c, "_"c)
    Next
    s = s.Replace(" ", "_")
    s = s.Replace("__", "_")
    Return s
End Function

' =====================================================================
' FIM
' =====================================================================
