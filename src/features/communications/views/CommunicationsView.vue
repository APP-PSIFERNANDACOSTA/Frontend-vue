<script setup lang="ts">
import { Bell, CheckCircle2, MessageSquare, Settings } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotifications } from '@/features/notifications/queries'
import PageHeader from '@/shared/components/PageHeader.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import MessagesTab from '../components/MessagesTab.vue'
import NotificationsTab from '../components/NotificationsTab.vue'
import ReminderSettingsTab from '../components/ReminderSettingsTab.vue'
import TasksTab from '../components/TasksTab.vue'

const TABS = ['notifications', 'tasks', 'messages', 'settings'] as const
const route = useRoute()
const router = useRouter()
// a aba vive na URL (?tab=), então links como /communications?tab=settings continuam funcionando
const tab = computed({
  get: () => (TABS as readonly string[]).includes(String(route.query.tab)) ? String(route.query.tab) : 'notifications',
  set: (v: string) => router.replace({ query: { ...route.query, tab: v } }),
})
const notifications = useNotifications()
const unread = computed(() => notifications.data.value?.unread_count ?? 0)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Comunicações e tarefas" description="Notificações, mensagens e gestão de tarefas" />
    <Tabs v-model="tab">
      <TabsList class="h-auto w-full flex-wrap justify-start sm:w-auto">
        <TabsTrigger value="notifications" class="relative gap-2"><Bell class="size-4" />Notificações<span v-if="unread" class="ml-1 flex size-5 items-center justify-center rounded-full bg-destructive text-xs font-semibold text-white">{{ unread > 9 ? '9+' : unread }}</span></TabsTrigger>
        <TabsTrigger value="tasks" class="gap-2"><CheckCircle2 class="size-4" />Tarefas</TabsTrigger>
        <TabsTrigger value="messages" class="gap-2"><MessageSquare class="size-4" />Mensagens</TabsTrigger>
        <TabsTrigger value="settings" class="gap-2"><Settings class="size-4" />Configurações</TabsTrigger>
      </TabsList>
      <TabsContent value="notifications" class="mt-4"><NotificationsTab /></TabsContent>
      <TabsContent value="tasks" class="mt-4"><TasksTab /></TabsContent>
      <TabsContent value="messages" class="mt-4"><MessagesTab /></TabsContent>
      <TabsContent value="settings" class="mt-4"><ReminderSettingsTab /></TabsContent>
    </Tabs>
  </div>
</template>
