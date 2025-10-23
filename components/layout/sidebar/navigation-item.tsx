'use client';

import Link from 'next/link';
import { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItemProps {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  current: boolean;
  isLocked: boolean;
  showBadge: boolean;
  badgeCount?: number;
  showHint: boolean;
  onNavClick: () => void;
  onLockedClick: () => void;
}

const NAV_ITEM_BASE_CLASSES = cn(
  'inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background',
  'focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  'w-full justify-start gap-3 px-3 py-3 h-auto select-none transition-all duration-200',
  'hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
);

const LOCKED_BUTTON_CLASSES = cn(
  'w-full justify-start gap-3 px-3 py-3 h-auto cursor-pointer select-none',
  'opacity-75 hover:opacity-90 hover:bg-accent/50 transition-all duration-200',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
);

function NavigationItemBadge({ count }: { count: number }) {
  return (
    <Badge
      variant="secondary"
      className="text-xs px-1.5 py-0 h-4 min-w-[16px] rounded-[3px] flex items-center justify-center"
    >
      {count}
    </Badge>
  );
}

function NavigationItemContent({
  icon: Icon,
  name,
  description,
  showBadge,
  badgeCount,
  current,
  isLocked,
}: {
  icon: LucideIcon;
  name: string;
  description: string;
  showBadge: boolean;
  badgeCount?: number;
  current: boolean;
  isLocked: boolean;
}) {
  return (
    <>
      <Icon className="h-5 w-5" />
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          {showBadge && badgeCount && badgeCount > 0 && <NavigationItemBadge count={badgeCount} />}
        </div>
        {isLocked ? (
          <span className="text-xs text-red-800 hover:text-red-900 bg-red-50 px-2 py-1 rounded-[3px]">
            Sign in to access
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
    </>
  );
}

function NavigationItemComponent({
  id,
  name,
  href,
  icon,
  description,
  current,
  isLocked,
  showBadge,
  badgeCount,
  showHint,
  onNavClick,
  onLockedClick,
}: NavigationItemProps) {
  if (isLocked) {
    return (
      <div>
        <Button variant="ghost" className={LOCKED_BUTTON_CLASSES} onClick={onLockedClick}>
          <NavigationItemContent
            icon={icon}
            name={name}
            description={description}
            showBadge={showBadge}
            badgeCount={badgeCount}
            current={current}
            isLocked={true}
          />
        </Button>
        {showHint && (
          <div className="px-3 py-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-md mx-2 mt-1">
            💡 Sign in to save JSONs permanently
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={href} onClick={onNavClick} data-testid={`nav-${id}`} prefetch={true}>
      <div
        className={cn(
          NAV_ITEM_BASE_CLASSES,
          current
            ? 'bg-secondary text-secondary-foreground border border-border/50 relative'
            : 'hover:bg-accent hover:text-accent-foreground relative'
        )}
      >
        {current && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute inset-0 bg-secondary rounded-md border border-border/50 -z-10"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <NavigationItemContent
          icon={icon}
          name={name}
          description={description}
          showBadge={showBadge}
          badgeCount={badgeCount}
          current={current}
          isLocked={false}
        />
      </div>
    </Link>
  );
}

export const NavigationItem = memo(NavigationItemComponent);
