import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props} />
  );
}

// Predefined skeleton variants for common use cases
const SkeletonCard = ({ className }) => (
  <div className={cn("p-4 space-y-3", className)}>
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[150px]" />
  </div>
)

const SkeletonTransaction = ({ className }) => (
  <div className={cn("flex items-center space-x-4 p-4", className)}>
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
    <Skeleton className="h-4 w-[80px] ml-auto" />
  </div>
)

const SkeletonBalance = ({ className }) => (
  <div className={cn("space-y-2", className)}>
    <Skeleton className="h-8 w-[180px]" />
    <Skeleton className="h-4 w-[120px]" />
  </div>
)

export { Skeleton, SkeletonCard, SkeletonTransaction, SkeletonBalance }
