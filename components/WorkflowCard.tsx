import Image from "next/image";

interface WorkflowCardProps {
  title: string;
  imageSrc: string;
  description?: string;
  editedAt?: string;
}

export default function WorkflowCard({ title, imageSrc, description, editedAt }: WorkflowCardProps) {
  return (
    <div className="group cursor-pointer flex flex-col overflow-hidden rounded-[18px] border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {/* We use standard img for simplicity without strict next/image config, but Next Image is preferred */}
        <img
          src={imageSrc}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col p-4">
        <h3 className="font-brand text-sm font-semibold text-foreground line-clamp-1">{title}</h3>
        {description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>}
        {editedAt && <p className="mt-1 text-xs text-muted-foreground">Edited {editedAt}</p>}
      </div>
    </div>
  );
}
