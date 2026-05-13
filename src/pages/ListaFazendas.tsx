import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Copy, Trash2, Upload, Image as ImageIcon, X, LogOut, Shield, FolderUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { RehagroLogo } from '@/components/ui/RehagroLogo'
import { getFazendas, saveFazenda, deleteFazenda, duplicateFazenda } from '@/lib/storage'
import { extrairMensagemErro } from '@/lib/supabase'
import { DEFAULT_PARAMETROS, DEFAULT_ESTADO_ATUAL } from '@/lib/defaults'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  temLocalStorageImportavel,
  importarFazendasLocalStorage,
  listarFazendasLocalStorage,
  dispensarBanner,
} from '@/services/migracao'
import type { Fazenda } from '@/types'

const MAX_LOGO_SIZE = 1024 * 1024 // 1 MB

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface Props {
  onAbrir: (id: string) => void
}

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ListaFazendas({ onAbrir }: Props) {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [fazendas, setFazendas] = useState<Fazenda[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNova, setModalNova] = useState(false)
  const [modalRenomear, setModalRenomear] = useState<Fazenda | null>(null)
  const [nomeInput, setNomeInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [mostrarBannerImport, setMostrarBannerImport] = useState(false)
  const [importando, setImportando] = useState(false)
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({})

  const recarregar = async () => {
    try {
      const lista = await getFazendas()
      setFazendas(lista)
    } catch (e) {
      setErroGeral(extrairMensagemErro(e))
    }
  }

  useEffect(() => {
    let alive = true
    setCarregando(true)
    getFazendas()
      .then(lista => {
        if (!alive) return
        setFazendas(lista)
        // Banner de importação só aparece se a conta tem 0 fazendas E tem localStorage
        if (lista.length === 0 && temLocalStorageImportavel()) {
          setMostrarBannerImport(true)
        }
      })
      .catch(e => {
        if (!alive) return
        setErroGeral(extrairMensagemErro(e))
      })
      .finally(() => {
        if (alive) setCarregando(false)
      })
    return () => { alive = false }
  }, [])

  const handleLogoUpload = async (f: Fazenda, file: File) => {
    setLogoError(null)
    if (!file.type.startsWith('image/')) {
      setLogoError('Arquivo deve ser uma imagem (PNG, JPG, SVG).')
      return
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError('Imagem muito grande (máx 1 MB).')
      return
    }
    try {
      const base64 = await fileToBase64(file)
      await saveFazenda({ ...f, logoBase64: base64 })
      await recarregar()
    } catch (e) {
      setLogoError(extrairMensagemErro(e))
    }
  }

  const handleLogoRemove = async (f: Fazenda) => {
    try {
      await saveFazenda({ ...f, logoBase64: null })
      await recarregar()
    } catch (e) {
      setErroGeral(extrairMensagemErro(e))
    }
  }

  const criarFazenda = async () => {
    if (!nomeInput.trim()) return
    const nova: Fazenda = {
      id: crypto.randomUUID(),
      nome: nomeInput.trim(),
      dataCriacao: new Date().toISOString(),
      dataUltimoUpload: null,
      parametros: { ...DEFAULT_PARAMETROS },
      rebanhoAtual: null,
      estadoAtual: { ...DEFAULT_ESTADO_ATUAL },
      cenarioA: null,
      cenarioB: null,
      previstoRealizado: [],
    }
    try {
      await saveFazenda(nova)
      setNomeInput('')
      setModalNova(false)
      await recarregar()
      onAbrir(nova.id)
    } catch (e) {
      setErroGeral(extrairMensagemErro(e))
    }
  }

  const renomear = async () => {
    if (!modalRenomear || !nomeInput.trim()) return
    try {
      await saveFazenda({ ...modalRenomear, nome: nomeInput.trim() })
      setModalRenomear(null)
      setNomeInput('')
      await recarregar()
    } catch (e) {
      setErroGeral(extrairMensagemErro(e))
    }
  }

  /** Duplica como nova evolução. Sugere nome com mês/ano atual. */
  const duplicar = async (f: Fazenda) => {
    try {
      await duplicateFazenda(f.id)
      await recarregar()
    } catch (e) {
      setErroGeral(extrairMensagemErro(e))
    }
  }

  const excluir = async (id: string) => {
    try {
      await deleteFazenda(id)
      setConfirmDelete(null)
      await recarregar()
    } catch (e) {
      setErroGeral(extrairMensagemErro(e))
    }
  }

  const importarLocalStorage = async () => {
    setImportando(true)
    try {
      const res = await importarFazendasLocalStorage()
      if (res.erros.length > 0) {
        setErroGeral(`Importadas ${res.ok}, com ${res.erros.length} erro(s): ${res.erros.map(e => e.nome).join(', ')}`)
      }
      await recarregar()
      setMostrarBannerImport(false)
    } finally {
      setImportando(false)
    }
  }

  const dispensar = () => {
    dispensarBanner()
    setMostrarBannerImport(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-bg-elev border-b border-line sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RehagroLogo variant="dark" className="h-11 w-auto" />
            <div className="border-l border-line pl-4">
              <h1 className="text-sm font-semibold text-ink">Evolução de Rebanho</h1>
              <p className="text-xs text-ink-3">
                {profile?.nome ? `Olá, ${profile.nome}` : 'Planejamento leiteiro'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile?.perfil === 'admin' && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <Shield size={14} />
                Admin
              </Button>
            )}
            <Button onClick={() => { setNomeInput(''); setModalNova(true) }}>
              <Plus size={16} />
              Nova Fazenda
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} title="Sair">
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Banner: importar localStorage */}
        {mostrarBannerImport && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-brand-tint-2 border border-brand-soft">
            <div className="flex items-start gap-3">
              <FolderUp size={18} className="text-brand shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-3">
                  Encontramos {listarFazendasLocalStorage().length} fazenda(s) salva(s) localmente neste navegador
                </p>
                <p className="text-xs text-ink-2 mt-1">
                  Importe pra sua conta agora. Depois você acessa de qualquer dispositivo.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={importarLocalStorage} disabled={importando}>
                    {importando ? 'Importando…' : 'Importar agora'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={dispensar} disabled={importando}>
                    Não importar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {logoError && (
          <div className="mb-4 px-4 py-2.5 rounded-md bg-status-bad/10 border border-status-bad/30 text-status-bad text-sm flex items-center justify-between gap-3">
            <span>{logoError}</span>
            <button onClick={() => setLogoError(null)} className="text-status-bad/70 hover:text-status-bad">
              <X size={14} />
            </button>
          </div>
        )}

        {erroGeral && (
          <div className="mb-4 px-4 py-2.5 rounded-md bg-status-bad/10 border border-status-bad/30 text-status-bad text-sm flex items-center justify-between gap-3">
            <span>{erroGeral}</span>
            <button onClick={() => setErroGeral(null)} className="text-status-bad/70 hover:text-status-bad">
              <X size={14} />
            </button>
          </div>
        )}

        {carregando ? (
          <div className="flex justify-center py-20">
            <p className="text-sm text-ink-4 font-mono">Carregando fazendas…</p>
          </div>
        ) : fazendas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <RehagroLogo variant="dark" className="h-20 w-auto mb-5 opacity-90" />
            <h2 className="text-lg font-semibold text-ink mb-2">Nenhuma fazenda cadastrada</h2>
            <p className="text-sm text-ink-3 mb-6 max-w-sm">
              Crie uma nova fazenda para começar a projetar a evolução do rebanho.
            </p>
            <Button onClick={() => { setNomeInput(''); setModalNova(true) }}>
              <Plus size={16} />
              Criar primeira fazenda
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-ink">
                {fazendas.length} fazenda{fazendas.length !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="grid gap-3">
              {fazendas.map(f => (
                <Card key={f.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex-1 flex items-center gap-4 cursor-pointer"
                        onClick={() => onAbrir(f.id)}
                      >
                        {f.logoBase64 ? (
                          <img
                            src={f.logoBase64}
                            alt={`Logo ${f.nome}`}
                            className="w-10 h-10 rounded-xl object-contain bg-surface-2 border border-line shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-brand-tint flex items-center justify-center shrink-0 text-brand-3 font-semibold text-sm">
                            {f.nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-ink truncate">{f.nome}</h3>
                            {f.rebanhoAtual ? (
                              <Badge variant="success">Com dados</Badge>
                            ) : (
                              <Badge variant="muted">Sem dados</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-ink-3">
                            <span>Criada em {formatarData(f.dataCriacao)}</span>
                            {f.dataUltimoUpload && (
                              <span className="flex items-center gap-1">
                                <Upload size={10} />
                                Upload {formatarData(f.dataUltimoUpload)}
                              </span>
                            )}
                            {f.estadoAtual.vacasLactacao > 0 && (
                              <span className="font-medium text-ink font-mono tabular-nums">
                                {Math.round(f.estadoAtual.vacasLactacao)} VL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          ref={el => { fileInputsRef.current[f.id] = el }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleLogoUpload(f, file)
                            e.target.value = ''
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          title={f.logoBase64 ? 'Trocar logo da fazenda' : 'Adicionar logo da fazenda'}
                          onClick={() => fileInputsRef.current[f.id]?.click()}
                        >
                          <ImageIcon size={14} />
                        </Button>
                        {f.logoBase64 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Remover logo"
                            onClick={() => handleLogoRemove(f)}
                          >
                            <X size={14} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Renomear"
                          onClick={() => { setModalRenomear(f); setNomeInput(f.nome) }}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Duplicar como nova evolução (sugere mês/ano)"
                          onClick={() => duplicar(f)}
                        >
                          <Copy size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Excluir"
                          onClick={() => setConfirmDelete(f.id)}
                        >
                          <Trash2 size={14} className="text-status-bad" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Nova Fazenda */}
      <Modal open={modalNova} onClose={() => setModalNova(false)} title="Nova Fazenda">
        <div className="flex flex-col gap-4">
          <Input
            label="Nome da fazenda"
            placeholder="Ex: Fazenda São João"
            value={nomeInput}
            onChange={e => setNomeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && criarFazenda()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalNova(false)}>Cancelar</Button>
            <Button onClick={criarFazenda} disabled={!nomeInput.trim()}>Criar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Renomear */}
      <Modal open={!!modalRenomear} onClose={() => setModalRenomear(null)} title="Renomear Fazenda">
        <div className="flex flex-col gap-4">
          <Input
            label="Novo nome"
            value={nomeInput}
            onChange={e => setNomeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && renomear()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalRenomear(null)}>Cancelar</Button>
            <Button onClick={renomear} disabled={!nomeInput.trim()}>Salvar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir Fazenda">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-2">
            Tem certeza que deseja excluir esta fazenda? Todos os dados (parâmetros, uploads, projeções) serão perdidos permanentemente.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDelete && excluir(confirmDelete)}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
