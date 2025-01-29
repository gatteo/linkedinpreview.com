import type React from "react"
import { createContext, useContext, useState } from "react"

type ScreenSize = "mobile" | "tablet" | "desktop"

interface PreviewSizeContextType {
  screenSize: ScreenSize
  setScreenSize: React.Dispatch<React.SetStateAction<ScreenSize>>
}

const PreviewSizeContext = createContext<PreviewSizeContextType | undefined>(undefined)

export const ScreenSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screenSize, setScreenSize] = useState<ScreenSize>("desktop")

  return <PreviewSizeContext.Provider value={{ screenSize, setScreenSize }}>{children}</PreviewSizeContext.Provider>
}

export const useScreenSize = () => {
  const context = useContext(PreviewSizeContext)
  if (context === undefined) {
    throw new Error("useScreenSize must be used within a ScreenSizeProvider")
  }
  return context
}

