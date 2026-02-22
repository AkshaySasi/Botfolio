import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      toastOptions={{
        style: {
          background: '#141414',
          border: '1px solid rgba(16,185,129,0.25)',
          color: '#f0fdf4',
          borderRadius: '0.875rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          backdropFilter: 'none',
          opacity: 1,
        },
        classNames: {
          toast: 'group toast',
          title: 'text-white font-semibold text-sm',
          description: 'text-gray-400 text-xs',
          success: '!border-emerald-500/30',
          error: '!border-red-500/30',
          warning: '!border-yellow-500/30',
          info: '!border-blue-500/30',
          actionButton: 'bg-emerald-500 text-black font-semibold',
          cancelButton: 'bg-white/10 text-gray-300',
          closeButton: 'text-gray-500 hover:text-white',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
export { toast } from "sonner";
