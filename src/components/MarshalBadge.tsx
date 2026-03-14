import { cn } from "@/lib/utils";

interface MarshalBadgeProps {
  className?: string;
  size?: number;
}

/** Premium US Marshal rozet SVG - bölüm ayırıcı ve dekoratif kullanım için */
export default function MarshalBadge({ className, size = 32 }: MarshalBadgeProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("text-primary", className)}
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
    >
      <path
        d="M32 4L4 20v24l28 16 28-16V20L32 4zm0 4.5L56 22v20L32 55.5 8 42V22l24-13.5z"
        fill="currentColor"
        opacity={0.9}
      />
      <path
        d="M32 12L12 24v16l20 12 20-12V24L32 12zm0 4L52 24v12L32 48 12 36V24l20-8z"
        fill="currentColor"
        opacity={0.6}
      />
      <path
        d="M32 20c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
        fill="currentColor"
      />
      <path
        d="M32 28l-6 10h4v6h4v-6h4L32 28z"
        fill="currentColor"
      />
    </svg>
  );
}
