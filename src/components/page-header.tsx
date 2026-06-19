import { motion } from "framer-motion";

export function PageHeader({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 py-6"
    >
      {icon && (
        <div className="grid h-12 w-12 place-items-center rounded-2xl glass-card shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl md:text-3xl font-bold truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right}
    </motion.header>
  );
}
