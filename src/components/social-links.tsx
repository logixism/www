"use client";

import Link from "next/link";
import { config, SocialLink } from "@//lib/config";
import { useClipboard } from "@//hooks/use-clipboard";
import { useState, useCallback } from "react";
import { ClipboardCheck } from "lucide-react";

interface SocialLinkItemProps {
  link: SocialLink;
}

function SocialLinkItem({ link }: SocialLinkItemProps) {
  const { copy } = useClipboard();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if ("textToCopy" in link) {
      copy(link.textToCopy).then(setIsCopied);
      setTimeout(() => setIsCopied(false), 1500);
    }
  }, [copy, link]);

  if ("href" in link) {
    return (
      <Link
        className="flex justify-center items-center hover:bg-primary/5 cursor-pointer transition-colors w-full p-4"
        href={link.href}
      >
        <link.icon className="text-primary" size={32} />
      </Link>
    );
  }

  return (
    <button
      className={`flex justify-center items-center hover:bg-primary/10 cursor-pointer transition-colors w-full p-4`}
      onClick={handleCopy}
    >
      <ClipboardCheck
        className={`absolute text-emerald-600 transition-all ${!isCopied ? "scale-0" : ""}`}
        size={32}
      />
      <link.icon
        className={`absolute text-primary transition-all  ${isCopied ? "scale-0" : ""}`}
        size={32}
      />
    </button>
  );
}

export default function SocialLinks() {
  return (
    <div className="flex flex-row w-full mt-6 border rounded-lg divide-x divide-border overflow-hidden ">
      {config.socialLinks.map((link) => (
        <SocialLinkItem key={link.name} link={link} />
      ))}
    </div>
  );
}
