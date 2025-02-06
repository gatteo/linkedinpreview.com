<p align="center">
  <img alt="Tool Preview" src="https://linkedinpreview.com/images/og/og.png">
</p>

<h1 align="center">
  LinkedIn Post Preview
</h1>

A free, open source, online tool to write, format, and preview your LinkedIn posts before publishing them. Add bold, italic, and emoji to your LinkedIn posts, and see how they will look on desktop and mobile.

## ✨ Tool Features

- Preview LinkedIn Post on Mobile Devices
- Preview LinkedIn Post on Tabet Devices
- Preview LinkedIn Post on Desktop Devices
- Bold Text Formatting
- Strikethrough Text Formatting
- Underline Text Formatting
- Italic Text Formatting
- Bullet Point List
- Numbered List

## 💫 Tech Stack & Features

- ⚡️ Next.js 14 with App Router (Turbo)
- 📝 MDX & ContentLayer - for blog posts
- 🎨 Tailwind CSS - for styling
- 🌈 shadcn/ui & Radix UI - UI components
- 🛡 Strict TypeScript and ESLint configuration
- 📱 Responsive design
- 🌗 Light / Dark mode
- 📈 SEO optimized with meta tags and JSON-LD
- 📰 RSS feed
- 🗺 Sitemap
- 📊 Google Analytics
- 📖 Table of contents for blog posts
- 📷 Image zoom - zoom in on images in blog posts
- 📝 Code syntax highlighting - using Shiki
- 🎨 Animation - using Framer Motion
- 🤖 GitHub Actions for CI/CD
- 🏠 LightHouse score of nearly 100
- 💄 Prettier - code formatting
- 👷🏻‍♂️ t3-env - validate environment variables before building

## 🔨 Requirements

- Node, recommended `20.x`
- pnpm, recommended `8.14.0`
- PostgreSQL, recommended `14.x` (optional if you don't need all the functionalities)
- [Visual Studio Code](https://code.visualstudio.com/) with [recommended extensions](.vscode/extensions.json)
- Optionally [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en)

## 👋 Getting Started

Follow these steps to run the project locally on your machine:

```bash
git clone https://github.com/gatteo/linkedinpreview.com.git
cd linkedinpreview.com
pnpm install
```

Create a `.env.local` file based on the provided `.env.example` file and fill in the necessary variables.

OR you can skip this by modifying `apps/web/src/env.ts`:

```ts
export const env = createEnv({
    skipValidation: true,

    server: {
        // ...
    },
})
```

To run the app in development mode:

```bash
pnpm dev
```

The app will be available at `localhost:3000`.

## ✍🏻 Author

[@gatteo](https://github.com/gatteo)

## Sponsors

<table>
  <tr>
    <td align="center">
      <a href="https://wezard.it/?utm_source=github.com&utm_medium=linkedinpreview" target="_blank">
        <img src="https://storage.googleapis.com/westudents-public/team-images/Animazione_firma-2.gif" width="200px;" alt="Speakeasy API" />
      </a>
      <br />
      <b>Wezard</b>
      <br />
      <a href="https://wezard.it/?utm_source=github.com&utm_medium=linkedinpreview" target="_blank">wezard.it</a>
      <br />
      <p width="200px">React Native App<br /> Development Company</p>
    </td>
  </tr>
</table>

## 🪪 License

This project is open source and available under the [MIT License](LICENSE).

<hr>
<p align="center">
Made with ❤️ in Turin (Italy)
</p>
