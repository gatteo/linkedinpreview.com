import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export type PageMetadata = {
    slug: string
}

const mdxFilesRootDirectory = path.join(process.cwd(), 'contents')

const readFile = (filePath: string) => {
    return fs.readFileSync(filePath, 'utf8')
}

const readMDXFile = <T>(filePath: string) => {
    const rawContent = readFile(filePath)
    const { content, data } = matter(rawContent)

    return {
        content,
        metadata: data as T,
    }
}

export const getPage = <T>(filePath: string) => {
    const fullPath = path.join(mdxFilesRootDirectory, `${filePath}.mdx`)

    if (!fs.existsSync(fullPath)) {
        return null
    }

    const { content, metadata } = readMDXFile<T>(fullPath)

    return {
        content,
        metadata: {
            ...metadata,
            slug: filePath.split('/').pop(),
        } as T,
    }
}

type Options = {
    limit?: number
}

export const getAllPages = <T>(directoryPath: string, options: Options = {}) => {
    const { limit } = options

    const pagesDirectory = path.join(mdxFilesRootDirectory, directoryPath)

    const fileNames = fs.readdirSync(pagesDirectory)

    return fileNames
        .map((fileName) => {
            const slug = fileName.replace(/\.mdx$/, '')
            const fullPath = path.join(pagesDirectory, fileName)
            const { metadata } = readMDXFile<T>(fullPath)

            return {
                ...metadata,
                slug,
            } as T
        })
        .slice(0, limit)
}
