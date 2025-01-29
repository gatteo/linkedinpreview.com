import type React from "react"
import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { toPlainText, processNodes } from "../utils"

interface ContentSectionProps {
  content: string
}

export const ContentSection: React.FC<ContentSectionProps> = ({ content }) => {
  const [processedContent, setProcessedContent] = useState<string>("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMoreButton, setShowMoreButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!content) {
      return
    }

    const plainText = toPlainText(processNodes(content).content)
    setProcessedContent(plainText)
    checkContentOverflow()
  }, [content])

  const checkContentOverflow = () => {
    setTimeout(() => {
      const contentElement = contentRef.current
      if (contentElement) {
        const lineHeight = Number.parseInt(window.getComputedStyle(contentElement).lineHeight)
        const maxHeight = lineHeight * 3
        setShowMoreButton(contentElement.scrollHeight > maxHeight)
      }
    }, 0)
  }

  return (
    <div className="relative mt-5">
      <div
        ref={contentRef}
        className={cn("relative whitespace-pre-line text-sm", !isExpanded && "line-clamp-3 overflow-hidden")}
      >
        {processedContent}
      </div>
      {showMoreButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "text-sm font-semibold text-gray-500 hover:text-gray-700",
            isExpanded ? "mt-2" : "absolute bottom-0 right-0 bg-white pl-1",
          )}
        >
          {isExpanded ? "...less" : "...more"}
        </button>
      )}
    </div>
  )
}

