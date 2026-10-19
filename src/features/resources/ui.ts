import { File, FileText, Image, Presentation, Video } from '@lucide/vue'
import type { Component } from 'vue'
import { RESOURCE_CATEGORIES } from './types'

export const FILE_ICONS: Record<string, Component> = { pdf: FileText, video: Video, ppt: Presentation, doc: FileText, image: Image, other: File }
export const fileIcon = (t: string) => FILE_ICONS[t] ?? File
const TYPE_LABELS: Record<string, string> = { pdf: 'PDF', video: 'Vídeo', ppt: 'Apresentação', doc: 'Documento', image: 'Imagem' }
export const fileTypeLabel = (t: string) => TYPE_LABELS[t] ?? 'Arquivo'
export const categoryLabel = (c: string) => RESOURCE_CATEGORIES.find((x) => x.value === c)?.label ?? c
