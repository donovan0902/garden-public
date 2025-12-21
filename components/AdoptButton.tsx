"use client";

import { Button } from "@/components/ui/button";
import { Check, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

interface AdoptButtonProps {
  hasAdopted: boolean;
  isAuthenticated: boolean;
  onToggle: () => void;
}

export function AdoptButton({
  hasAdopted,
  isAuthenticated,
  onToggle,
}: AdoptButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        whileTap={{ scale: 1.15, rotate: -3 }}
        transition={{ type: "spring", stiffness: 800, damping: 20 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 rounded-full px-3 h-8 text-sm font-medium hover:!bg-background hover:!text-foreground hover:ring-2 hover:ring-accent hover:ring-offset-2 transition-all"
          asChild
        >
          <Link href="/sign-in" prefetch={false}>
            <UserPlus className="h-4 w-4" />
            <span>I use this</span>
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 1.15, rotate: -3 }}
      transition={{ type: "spring", stiffness: 800, damping: 20 }}
    >
      <Button
        variant={hasAdopted ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        className={`flex items-center gap-1.5 rounded-full px-3 h-8 text-sm font-medium hover:ring-2 hover:ring-accent hover:ring-offset-2 transition-all ${
          hasAdopted
            ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:!bg-emerald-700 hover:!text-white"
            : "hover:!bg-background hover:!text-foreground"
        }`}
      >
        {hasAdopted ? (
          <>
            <Check className="h-4 w-4" />
            <span>Using</span>
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            <span>I use this</span>
          </>
        )}
      </Button>
    </motion.div>
  );
}
