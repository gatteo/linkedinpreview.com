import type React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icon, type Icons } from "@/components/icon"
import { useScreenSize } from "./preview-size-context"

export const PreviewHeader: React.FC = () => {
  const { screenSize, setScreenSize } = useScreenSize()

  return (
    <div className="flex h-16 border-b px-4 sm:px-6">
      <div className="flex grow items-center justify-between">
        <h2 className="text-base font-semibold">Post Preview</h2>
        <Tabs value={screenSize} onValueChange={(v) => setScreenSize(v as typeof screenSize)}>
          <TabsList>
            {["mobile", "tablet", "desktop"].map((size) => (
              <TabsTrigger key={size} value={size}>
                <Icon name={size as keyof typeof Icons} className="size-5" />
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}

