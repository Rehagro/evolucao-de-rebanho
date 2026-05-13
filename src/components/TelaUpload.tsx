import { useState, useRef } from 'react'
import { Upload, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { UploadSlot, type UploadSlotEstado } from './ui/UploadSlot'
import {
  parseSecagem, parseAgendaParto, parseCrescimento,
  summarizeSecagem, summarizeAgenda, summarizeCrescimento,
} from '@/lib/csvParser'
import { RELATORIOS_IDEAGRI, TIPO_ORDER, type CSVTipo } from '@/lib/relatoriosIdeagri'
import type {
  Fazenda, VacaSecagem, PartoPrevisto, AnimalCrescimento,
} from '@/types'

interface Props {
  fazenda: Fazenda
  onSalvar: (f: Fazenda) => void
  onConcluir: () => void
}

interface SlotState {
  estado: UploadSlotEstado
  nomeArquivo?: string
  errors: string[]
  warnings: string[]
  secagem?: VacaSecagem[]
  agenda?: PartoPrevisto[]
  crescimento?: AnimalCrescimento[]
}

const SLOT_INICIAL: SlotState = { estado: 'vazio', errors: [], warnings: [] }

function lerArquivoComoTexto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file, 'ISO-8859-1')
  })
}

function detectarTipo(nome: string, conteudo: string): CSVTipo | null {
  const n = nome.toLowerCase()
  // Conteúdo também em lower pra match case-insensitive (Ideagri varia maiúsculas)
  const c = conteudo.toLowerCase()

  // 1) Tenta pelo NOME do arquivo
  if (n.includes('secag')) return 'secagem'
  if (n.includes('agenda') || n.includes('parto')) return 'agenda'
  // 'anima' pega "animal", "animais" (plural — mais comum nos nomes do Ideagri)
  if (n.includes('crescimento') || n.includes('jovem') || n.includes('anima')) return 'crescimento'

  // 2) Fallback pelo CONTEÚDO do CSV
  if (c.includes('dt. sec. prev.') || c.includes('sit. rep.')) return 'secagem'
  if (c.includes('parto previsto') || c.includes('parto simples')) return 'agenda'
  if (c.includes('idade (dias)') || c.includes('idade(dias)')) return 'crescimento'

  return null
}

export function TelaUpload({ fazenda, onSalvar, onConcluir }: Props) {
  const [slots, setSlots] = useState<Record<CSVTipo, SlotState>>({
    secagem: SLOT_INICIAL,
    agenda: SLOT_INICIAL,
    crescimento: SLOT_INICIAL,
  })
  const [processando, setProcessando] = useState(false)
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const dataRef = fazenda.dataUltimoUpload
    ? new Date(fazenda.dataUltimoUpload)
    : new Date()

  const processarArquivos = async (files: FileList) => {
    setProcessando(true)
    const updates: Partial<Record<CSVTipo, SlotState>> = {}

    for (const file of Array.from(files)) {
      const conteudo = await lerArquivoComoTexto(file)
      const tipo = detectarTipo(file.name, conteudo)

      if (!tipo) {
        // Sem tipo detectado — sinaliza erro no primeiro slot vazio
        const slotAlvo = (TIPO_ORDER.find(t => slots[t].estado === 'vazio' && !updates[t])) ?? 'secagem'
        updates[slotAlvo] = {
          estado: 'erro',
          nomeArquivo: file.name,
          errors: ['Não foi possível identificar o tipo do arquivo. Verifique se é um dos 3 relatórios Ideagri esperados.'],
          warnings: [],
        }
        continue
      }

      if (tipo === 'secagem') {
        const r = parseSecagem(conteudo)
        updates.secagem = {
          estado: r.errors.length > 0 ? 'erro' : 'sucesso',
          nomeArquivo: file.name,
          errors: r.errors, warnings: r.warnings,
          secagem: r.data,
        }
      } else if (tipo === 'agenda') {
        const r = parseAgendaParto(conteudo, dataRef)
        updates.agenda = {
          estado: r.errors.length > 0 ? 'erro' : 'sucesso',
          nomeArquivo: file.name,
          errors: r.errors, warnings: r.warnings,
          agenda: r.data,
        }
      } else {
        const r = parseCrescimento(conteudo)
        updates.crescimento = {
          estado: r.errors.length > 0 ? 'erro' : 'sucesso',
          nomeArquivo: file.name,
          errors: r.errors, warnings: r.warnings,
          crescimento: r.data,
        }
      }
    }

    setSlots(prev => ({ ...prev, ...updates }))
    setProcessando(false)
  }

  const limparSlot = (tipo: CSVTipo) => {
    setSlots(prev => ({ ...prev, [tipo]: SLOT_INICIAL }))
  }

  const algumSucesso = TIPO_ORDER.some(t => slots[t].estado === 'sucesso')

  const confirmar = () => {
    const dataAgora = new Date().toISOString()
    let novoRebanho = fazenda.rebanhoAtual ?? {
      dataReferencia: new Date(),
      vacasSecagem: [],
      partosPrevistos: [],
      animaisCrescimento: [],
    }
    let novoEstado = { ...fazenda.estadoAtual }

    const sec = slots.secagem
    if (sec.estado === 'sucesso' && sec.secagem) {
      novoRebanho = { ...novoRebanho, vacasSecagem: sec.secagem }
      const por = sec.secagem.reduce((acc, v) => {
        acc[v.sitRep] = (acc[v.sitRep] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)
      novoEstado = {
        ...novoEstado,
        vacasLactacao: sec.secagem.length,
        vacasVaziasAptas: por['Vaz. apt.'] ?? 0,
        vacasAtrasadas: por['Vaz. atr.'] ?? 0,
        vacasInseminadas_lt25: Math.round((por['Ins.'] ?? 0) * 0.5),
        vacasInseminadas_gt25: Math.round((por['Ins.'] ?? 0) * 0.5),
      }
    }

    const ag = slots.agenda
    if (ag.estado === 'sucesso' && ag.agenda) {
      novoRebanho = { ...novoRebanho, partosPrevistos: ag.agenda, dataReferencia: dataRef }
      const periodoSeco = fazenda.parametros.periodoSeco
      const vacasSecasCount = ag.agenda.filter(
        p => !p.isNovilha && p.faltamDias >= 0 && p.faltamDias <= periodoSeco,
      ).length
      novoEstado = { ...novoEstado, vacasSecas: vacasSecasCount }
    }

    const cr = slots.crescimento
    if (cr.estado === 'sucesso' && cr.crescimento) {
      novoRebanho = { ...novoRebanho, animaisCrescimento: cr.crescimento }
      const LIMITE_A54_DIAS = 14 * 30.44
      const novilhasAptas = cr.crescimento.filter(a => a.categoria === 'Novilha').length
      novoEstado = {
        ...novoEstado,
        bezerrasMenores180d: cr.crescimento.filter(
          a => a.categoria !== 'Novilha' && a.idadeDias <= 180,
        ).length,
        bezerrasNovilhas180dAteAptas: cr.crescimento.filter(
          a => a.categoria !== 'Novilha' && a.idadeDias > 180 && a.idadeDias <= LIMITE_A54_DIAS,
        ).length,
        novilhasVaziasAptas: (novoEstado.novilhasVaziasAptas ?? 0) + novilhasAptas,
      }
    }

    onSalvar({
      ...fazenda,
      rebanhoAtual: novoRebanho,
      estadoAtual: novoEstado,
      dataUltimoUpload: dataAgora,
    })
    onConcluir()
  }

  const renderResumo = (tipo: CSVTipo, slot: SlotState) => {
    if (slot.estado !== 'sucesso') return null

    if (tipo === 'secagem' && slot.secagem) {
      const s = summarizeSecagem(slot.secagem)
      return (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="info">{s.total} vacas</Badge>
          {Object.entries(s.porSitRep).map(([k, v]) => (
            <Badge key={k} variant="default">{k}: {v}</Badge>
          ))}
          {s.semDtSecPrev > 0 && (
            <Badge variant="warning">{s.semDtSecPrev} sem data sec.</Badge>
          )}
        </div>
      )
    }
    if (tipo === 'agenda' && slot.agenda) {
      const s = summarizeAgenda(slot.agenda)
      return (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="info">{s.total} partos</Badge>
          <Badge variant="default">{s.vacas} vacas</Badge>
          <Badge variant="default">{s.novilhas} novilhas</Badge>
          {s.jaOcorridos > 0 && <Badge variant="warning">{s.jaOcorridos} já ocorridos</Badge>}
        </div>
      )
    }
    if (tipo === 'crescimento' && slot.crescimento) {
      const s = summarizeCrescimento(slot.crescimento)
      return (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="info">{s.total} animais</Badge>
          {Object.entries(s.porFaixa).map(([k, v]) => (
            <Badge key={k} variant="default">{k}: {v}</Badge>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header com nome da fazenda em destaque */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-brand mb-1.5">
          Importar dados do Ideagri
        </p>
        <h1 className="font-display text-[32px] leading-tight text-ink">
          Importando para <span className="text-brand">{fazenda.nome}</span>
        </h1>
        <p className="text-sm text-ink-3 mt-2 max-w-xl">
          Importe os 3 relatórios do Ideagri abaixo. O tipo é detectado automaticamente
          pelo nome do arquivo ou pelo conteúdo.
        </p>
      </div>

      {/* Dropzone */}
      <Card>
        <CardContent className="py-3">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              if (e.dataTransfer.files.length > 0) processarArquivos(e.dataTransfer.files)
            }}
            className="border-2 border-dashed border-line rounded-md p-8 text-center cursor-pointer hover:border-brand hover:bg-brand-tint-2 transition-colors"
          >
            <Upload size={24} className="text-ink-3 mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink">
              Clique ou arraste os arquivos CSV aqui
            </p>
            <p className="text-xs text-ink-3 mt-1">
              O sistema detecta automaticamente qual relatório é cada arquivo
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".csv"
              className="hidden"
              onChange={e => e.target.files && processarArquivos(e.target.files)}
            />
          </div>

          {processando && (
            <div className="mt-3 text-center text-sm text-ink-3">
              Processando arquivos...
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3 Slots fixos */}
      <div className="space-y-3">
        {TIPO_ORDER.map(tipo => (
          <UploadSlot
            key={tipo}
            relatorio={RELATORIOS_IDEAGRI[tipo]}
            estado={slots[tipo].estado}
            nomeArquivo={slots[tipo].nomeArquivo}
            resumo={renderResumo(tipo, slots[tipo])}
            erros={slots[tipo].errors}
            avisos={slots[tipo].warnings}
            onRemover={slots[tipo].estado !== 'vazio' ? () => limparSlot(tipo) : undefined}
          />
        ))}
      </div>

      {/* Confirmar + Detalhes técnicos */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => setMostrarDetalhes(s => !s)}
          className="text-xs text-ink-3 hover:text-ink flex items-center gap-1"
        >
          {mostrarDetalhes ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          Detalhes técnicos
        </button>
        <Button onClick={confirmar} disabled={!algumSucesso}>
          <CheckCircle size={15} />
          Confirmar importação
        </Button>
      </div>

      {mostrarDetalhes && (
        <div className="text-xs text-ink-3 bg-surface-2 rounded-md p-3 space-y-1 border border-line">
          <p><span className="font-mono text-ink-4">Encoding:</span> ISO-8859-1 (latin-1)</p>
          <p><span className="font-mono text-ink-4">Separador:</span> ponto-e-vírgula (<code>;</code>)</p>
          <p><span className="font-mono text-ink-4">Linhas vazias</span> no início são ignoradas.</p>
        </div>
      )}
    </div>
  )
}
