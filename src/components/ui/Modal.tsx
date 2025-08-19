import * as Dialog from '@radix-ui/react-dialog'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md'
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[95vw] rounded-2xl bg-white/95 backdrop-blur-xl p-8 shadow-2xl border border-gray-200/50',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]',
            sizeClasses[size]
          )}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              {title && (
                <Dialog.Title className="text-2xl font-bold text-gray-800 tracking-tight">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="text-sm text-gray-600 mt-2">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded-xl p-2 opacity-70 ring-offset-white transition-all hover:opacity-100 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <XMarkIcon className="h-6 w-6 text-gray-600" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
