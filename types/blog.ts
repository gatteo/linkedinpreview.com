import { MDX } from 'contentlayer/core'

export type BlogPostAuthor = {
    id: string
    name: string
    url: string
    image: string
}

export type LocalBlogPost = {
    title: string
    createdAt: string
    modifiedAt: string
    summary: string
    image: string
    tags: string[]
    body: MDX
    slug: string
    author: BlogPostAuthor
}

export enum BlogPostSource {
    Local = 'LOCAL',
    Substack = 'SUBSTACK',
}

export type BlogPostPreview = {
    id: string | number
    slug: string
    title: string
    summary: string
    date: Date
    image: string | null
    source: BlogPostSource
    url: string
    tags?: string[]
    author: BlogPostAuthor
}

export type TOC = {
    title: string
    url: string
    depth: number
}
