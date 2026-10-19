<script setup lang="ts">
import { RotateCcw, Save } from '@lucide/vue'
import { ref } from 'vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { DEFAULT_BRAND, useBranding } from '@/shared/composables/useBranding'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import brandingService from '../branding.api'

const branding = useBranding()
const start = branding.current()
const primary = ref(start.primary)
const dark = ref(start.primaryDark)
const saving = ref(false)

const PRESETS = [
  { name: 'Rosa original', primary: DEFAULT_BRAND.primary, dark: DEFAULT_BRAND.primaryDark },
  { name: 'Azul', primary: '#60A5FA', dark: '#1e3a8a' },
  { name: 'Verde', primary: '#34D399', dark: '#064e3b' },
  { name: 'Roxo', primary: '#A78BFA', dark: '#4c1d95' },
  { name: 'Laranja', primary: '#FB923C', dark: '#7c2d12' },
  { name: 'Vermelho', primary: '#F87171', dark: '#7f1d1d' },
]
const valid = (c: string) => /^#[0-9a-f]{6}$/i.test(c)
// pré-visualiza na hora: o app todo reage às variáveis de marca
const preview = () => valid(primary.value) && valid(dark.value) && branding.setColors(primary.value, dark.value)
function pick(p: (typeof PRESETS)[number]) {
  primary.value = p.primary
  dark.value = p.dark
  preview()
}
function reset() {
  branding.reset()
  primary.value = DEFAULT_BRAND.primary
  dark.value = DEFAULT_BRAND.primaryDark
  brandingService.updateColors({ primary: primary.value, text: dark.value } as never).catch(() => {})
  notify.success('Cores restauradas', 'Paleta original da marca aplicada.')
}
async function save() {
  if (!valid(primary.value) || !valid(dark.value)) return notify.error('Cor inválida', 'Use o formato #RRGGBB.')
  saving.value = true
  branding.setColors(primary.value, dark.value)
  try {
    await brandingService.updateColors({ primary: primary.value, text: dark.value } as never)
    notify.success('Cores atualizadas!', 'As novas cores foram aplicadas em todo o sistema.')
  } catch {
    notify.warning('Cores aplicadas neste dispositivo', 'Não foi possível salvar no servidor.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <PageHeader title="Personalizar cores" description="Duas cores definem toda a paleta do sistema" back="/settings" />

    <SectionCard title="Cores principais" description="A prévia é aplicada na hora; clique em Salvar para manter">
      <div class="space-y-6">
        <div v-for="f in [{ label: 'Cor principal', hint: 'Botões, destaques, links e bordas de navegação', model: primary, set: (v: string) => (primary = v) }, { label: 'Cor escura / texto', hint: 'Texto sobre a cor principal e títulos de destaque', model: dark, set: (v: string) => (dark = v) }]" :key="f.label" class="space-y-3 first:border-0 [&:not(:first-child)]:border-t [&:not(:first-child)]:pt-6">
          <div><Label class="text-base font-semibold">{{ f.label }}</Label><p class="text-sm text-muted-foreground">{{ f.hint }}</p></div>
          <div class="flex items-center gap-4">
            <div class="size-20 shrink-0 rounded-xl border-2 shadow-sm" :style="{ backgroundColor: f.model }" />
            <div class="flex-1 space-y-2">
              <Input type="color" :model-value="f.model" class="h-11 w-28 cursor-pointer p-1" :aria-label="f.label" @update:model-value="(v) => (f.set(String(v)), preview())" />
              <Input :model-value="f.model" class="font-mono" maxlength="7" placeholder="#RRGGBB" :aria-label="`${f.label} (hex)`" @update:model-value="(v) => (f.set(String(v)), preview())" />
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-3 border-t pt-6 sm:flex-row">
          <Button class="flex-1" :disabled="saving" @click="save"><Save /> {{ saving ? 'Salvando...' : 'Salvar cores' }}</Button>
          <Button variant="outline" :disabled="saving" @click="reset"><RotateCcw /> Restaurar original</Button>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="Paletas prontas" description="Clique para pré-visualizar">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
        <button v-for="p in PRESETS" :key="p.name" type="button" class="rounded-lg border-2 p-4 text-left transition-all hover:border-brand hover:shadow-md" @click="pick(p)">
          <div class="mb-2 flex gap-2"><span class="size-10 rounded" :style="{ backgroundColor: p.primary }" /><span class="size-10 rounded" :style="{ backgroundColor: p.dark }" /></div>
          <p class="text-sm font-medium">{{ p.name }}</p>
        </button>
      </div>
    </SectionCard>
  </div>
</template>
