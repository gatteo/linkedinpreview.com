import { MDXOptions } from 'contentlayer/core'
import { defineDocumentType, makeSource } from 'contentlayer/source-files'

import { BlogAuthors } from './config/blog'
import { rehypePlugins, remarkPlugins } from './lib/mdx/plugins'

const BlogPost = defineDocumentType(() => ({
    name: 'BlogPost',
    filePathPattern: 'blog/**/*.mdx',
    contentType: 'mdx',
    fields: {
        title: {
            type: 'string',
            description: 'The title of the blog post',
            required: true,
        },
        createdAt: {
            type: 'string',
            description: 'The date of the blog post',
            required: true,
        },
        modifiedAt: {
            type: 'string',
            description: 'The modified time of the blog post',
            required: true,
        },
        summary: {
            type: 'string',
            description: 'The summary of the blog post',
            required: true,
        },
        image: {
            type: 'string',
            description: 'Image for the blog post',
            required: true,
        },
        authorId: {
            type: 'string',
            description: 'The author of the blog post',
            required: true,
        },
        tags: { type: 'list', of: { type: 'string' }, default: [] },
    },
    computedFields: {
        slug: {
            type: 'string',
            resolve: (doc) => doc._raw.sourceFileName.replace(/\.mdx$/, ''),
        },
        author: {
            type: 'nested',
            resolve: (doc) => BlogAuthors.find((author) => author.id === doc.authorId),
        },
    },
}))

const Pages = defineDocumentType(() => ({
    name: 'Pages',
    filePathPattern: 'pages/**/*.mdx',
    contentType: 'mdx',
    computedFields: {
        slug: {
            type: 'string',
            resolve: (doc) => doc._raw.sourceFileName.replace(/\.mdx$/, ''),
        },
    },
}))

const Comparison = defineDocumentType(() => ({
    name: 'Comparison',
    filePathPattern: 'compare/**/*.mdx',
    contentType: 'mdx',
    fields: {
        title: { type: 'string', required: true },
        competitor: { type: 'string', required: true },
        competitorUrl: { type: 'string', required: true },
        summary: { type: 'string', required: true },
        image: { type: 'string', required: false },
        createdAt: { type: 'string', required: true },
        modifiedAt: { type: 'string', required: true },
    },
    computedFields: {
        slug: {
            type: 'string',
            resolve: (doc) => doc._raw.sourceFileName.replace(/\.mdx$/, ''),
        },
    },
}))

export default makeSource({
    contentDirPath: 'contents',
    documentTypes: [BlogPost, Pages, Comparison],
    mdx: {
        remarkPlugins: remarkPlugins,
        rehypePlugins: rehypePlugins,
    } as MDXOptions,
})
