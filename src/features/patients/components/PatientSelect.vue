<script setup lang="ts">
/** Seleção de paciente com busca (combobox). v-model = id do paciente (ou null). Respeita o modo privacidade. */
import { Check, ChevronsUpDown, Loader2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { useActivePatients } from '../queries'

withDefaults(defineProps<{ disabled?: boolean; placeholder?: string; id?: string; clearable?: boolean; clearLabel?: string }>(), { placeholder: 'Selecione o paciente', clearLabel: 'Todos os pacientes' })
const model = defineModel<number | null>({ default: null })
const privacy = usePrivacyMode()
const open = ref(false)
const query = useActivePatients()
const patients = computed(() => query.data.value ?? [])
const selected = computed(() => patients.value.find((p) => p.id === model.value))
const pick = (id: number | null) => ((model.value = id), (open.value = false))
</script>

<template>
  <div v-if="query.isPending.value" class="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 class="size-4 animate-spin" /> Carregando pacientes ativos...</div>
  <p v-else-if="!patients.length" class="text-sm text-warning">Não há pacientes ativos cadastrados.</p>
  <Popover v-else v-model:open="open">
    <PopoverTrigger as-child>
      <Button :id="id" type="button" variant="outline" role="combobox" :aria-expanded="open" :disabled="disabled" class="h-10 w-full justify-between font-normal">
        <span class="truncate">{{ selected ? privacy.name(selected.name) : clearable ? clearLabel : placeholder }}</span>
        <ChevronsUpDown class="opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-(--reka-popover-trigger-width) min-w-64 p-0" align="start">
      <Command>
        <CommandInput placeholder="Buscar paciente..." />
        <CommandList>
          <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
          <CommandGroup>
            <CommandItem v-if="clearable" value="todos" @select="pick(null)">
              <Check :class="cn('size-4', model === null ? 'opacity-100' : 'opacity-0')" /> {{ clearLabel }}
            </CommandItem>
            <CommandItem v-for="p in patients" :key="p.id" :value="`${p.name} ${p.email ?? ''}`" @select="pick(p.id)">
              <Check :class="cn('size-4', model === p.id ? 'opacity-100' : 'opacity-0')" />
              <span class="min-w-0"><span class="block truncate">{{ privacy.name(p.name) }}</span><span v-if="p.email" class="block truncate text-xs text-muted-foreground">{{ privacy.email(p.email) }}</span></span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
