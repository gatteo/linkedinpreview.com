import remarkGfm from 'remark-gfm'
import { type PluggableList } from 'unified'

import { remarkHeading } from './remark/remark-heading'

// @ts-ignore
export const remarkPlugins: PluggableList = [remarkGfm, remarkHeading]
export const rehypePlugins: PluggableList = []
