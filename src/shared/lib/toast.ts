import { toast } from 'vue-sonner'

/** Notificações do app. Sucesso/info/aviso seguem a marca; erro é vermelho (ver AppToaster). */
export const notify = {
  success: (title: string, description?: string) => toast.success(title, { description, duration: 3500 }),
  error: (title: string, description?: string) => toast.error(title, { description, duration: 6000 }),
  info: (title: string, description?: string) => toast.info(title, { description, duration: 4000 }),
  warning: (title: string, description?: string) => toast.warning(title, { description, duration: 5000 }),
  loading: (title: string, description?: string) => toast.loading(title, { description }),
  dismiss: (id?: string | number) => toast.dismiss(id),
  /** Promessa: loading → sucesso/erro. */
  promise: <T,>(p: Promise<T>, msgs: { loading: string; success: string; error: string }) => toast.promise(p, msgs),
}
