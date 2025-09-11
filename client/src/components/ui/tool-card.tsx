import { forwardRef } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export interface ToolCardProps extends React.HTMLAttributes<HTMLDivElement> {
  href?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

const ToolCard = forwardRef<HTMLDivElement, ToolCardProps>(
  ({ className, href, icon, title, description, children, ...props }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn(
          "tool glass rounded-xl p-6 transition-all duration-200 hover:scale-105 cursor-pointer relative overflow-hidden",
          className
        )}
        {...props}
      >
        <div className="glow"></div>
        {children || (
          <div className="text-center">
            {icon && (
              <div className="h-12 w-12 rounded-xl bg-primary/20 grid place-items-center mx-auto mb-4">
                {icon}
              </div>
            )}
            {title && <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        )}
      </div>
    );

    if (href) {
      return <Link href={href}>{content}</Link>;
    }

    return content;
  }
);

ToolCard.displayName = "ToolCard";

export { ToolCard };
