import type { ReactNode } from "react"

export type FeatureItemProps = {
  icon: ReactNode
  title: string
  description: string
}

export type MiniCardProps = {
  icon: ReactNode
  title: string
  description: string
}

export type LoginFormValues = {
  username: string
  password: string
  remember: boolean
}