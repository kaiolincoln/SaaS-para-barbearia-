"use client"

import Image, { type ImageProps } from "next/image"
import { useId, type CSSProperties } from "react"
import { cn } from "@/_lib/utils"

/** Cover imagery only: luminance maps exactly from ink to bone in sRGB. */
export default function DuotonePhoto({
  className,
  style,
  alt,
  ...props
}: ImageProps) {
  const id = `duotone-${useId().replace(/:/g, "")}`
  return (
    <>
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
        className="absolute"
      >
        <defs>
          <filter id={id} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.1" intercept="-0.05" />
              <feFuncG type="linear" slope="1.1" intercept="-0.05" />
              <feFuncB type="linear" slope="1.1" intercept="-0.05" />
            </feComponentTransfer>
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.105882 0.929412" />
              <feFuncG type="table" tableValues="0.105882 0.917647" />
              <feFuncB type="table" tableValues="0.113725 0.894118" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <Image
        {...props}
        alt={alt}
        className={cn("photo-duotone object-cover", className)}
        style={{ ...style, "--duotone-filter": `url(#${id})` } as CSSProperties}
      />
    </>
  )
}
